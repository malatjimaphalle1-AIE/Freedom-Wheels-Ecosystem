'use client'

import { useFreedomStore, type CartItem } from '@/lib/freedom-store'
import { useAuth } from '@/components/freedom/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  Star,
  ShoppingCart,
  Brain,
  Filter,
  Minus,
  Plus,
  Trash2,
  Wallet,
  CheckCircle2,
  XCircle,
  Loader2,
  Package,
  ArrowRight,
} from 'lucide-react'
import { useState } from 'react'
import { useEngineBus } from '@/lib/engine-bus'

const categories = ['All', 'Engines', 'Templates', 'Data', 'AI Models', 'Plugins']

const products = [
  {
    id: 'p1',
    name: 'AI Content Engine Pro',
    category: 'Engines',
    price: 149,
    rating: 4.8,
    reviews: 234,
    desc: 'Advanced content generation and syndication engine with multi-platform support',
    badge: 'BEST SELLER',
  },
  {
    id: 'p2',
    name: 'Lead Scoring AI',
    category: 'AI Models',
    price: 79,
    rating: 4.6,
    reviews: 156,
    desc: 'Machine learning model for predictive lead scoring and qualification',
    badge: 'NEW',
  },
  {
    id: 'p3',
    name: 'Crypto Arbitrage Template',
    category: 'Templates',
    price: 99,
    rating: 4.3,
    reviews: 89,
    desc: 'Pre-built arbitrage detection and execution template for crypto markets',
    badge: null,
  },
  {
    id: 'p4',
    name: 'Social Media Sync',
    category: 'Plugins',
    price: 49,
    rating: 4.5,
    reviews: 201,
    desc: 'Cross-platform social media synchronization and scheduling plugin',
    badge: 'POPULAR',
  },
  {
    id: 'p5',
    name: 'Market Data Feed',
    category: 'Data',
    price: 199,
    rating: 4.9,
    reviews: 312,
    desc: 'Real-time market data aggregation from 50+ sources with AI analysis',
    badge: 'PREMIUM',
  },
  {
    id: 'p6',
    name: 'Email Sequence Builder',
    category: 'Templates',
    price: 69,
    rating: 4.4,
    reviews: 178,
    desc: 'Drag-and-drop email sequence builder with AI-powered copy optimization',
    badge: null,
  },
]

export default function MarketplaceView() {
  const {
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    addNotification,
    addLog,
  } = useFreedomStore()

  const { user, localUser } = useAuth()
  const email = user?.email || localUser?.email || ''
  const { dispatch } = useEngineBus()

  const [activeCategory, setActiveCategory] = useState('All')
  const [aiDescriptions, setAiDescriptions] = useState<Record<string, string>>({})
  const [loadingAi, setLoadingAi] = useState<string | null>(null)
  const [cartOpen, setCartOpen] = useState(false)

  // Checkout states
  const [checkoutDialog, setCheckoutDialog] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'processing' | 'success' | 'error'>('review')
  const [checkoutError, setCheckoutError] = useState('')

  // Added-to-cart feedback
  const [justAdded, setJustAdded] = useState<string | null>(null)

  const filteredProducts =
    activeCategory === 'All'
      ? products
      : products.filter((p) => p.category === activeCategory)

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const generateDescription = async (productId: string, productName: string) => {
    setLoadingAi(productId)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'content',
          data: { topic: `Write a compelling 2-sentence product description for: ${productName}` },
        }),
      })
      const data = await res.json()
      setAiDescriptions((prev) => ({ ...prev, [productId]: data.result }))
    } catch {
      setAiDescriptions((prev) => ({
        ...prev,
        [productId]: 'AI description generation failed.',
      }))
    }
    setLoadingAi(null)
  }

  const handleAddToCart = (product: typeof products[0]) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      badge: product.badge,
    })

    // Dispatch engine bus event
    dispatch({ source: 'marketplace-engine', type: 'marketplace:add_to_cart', target: 'ai-engine', payload: { itemId: product.id, itemName: product.name }, meta: { value: product.price } })

    // Visual feedback
    setJustAdded(product.id)
    setTimeout(() => setJustAdded(null), 1500)
  }

  const isInCart = (productId: string) => cart.some((c) => c.id === productId)

  const getCartQuantity = (productId: string) => {
    const item = cart.find((c) => c.id === productId)
    return item?.quantity || 0
  }

  // Checkout: pay from wallet
  const handleCheckout = async () => {
    setCheckoutStep('processing')
    setCheckoutError('')

    try {
      // First ensure wallet exists
      const walletRes = await fetch(`/api/wallet?email=${encodeURIComponent(email)}`)
      if (!walletRes.ok) throw new Error('Failed to load wallet')
      const walletData = await walletRes.json()
      const balance = walletData.wallet.balance

      if (balance < cartTotal) {
        throw new Error(`Insufficient wallet balance. You have $${balance.toFixed(2)} but need $${cartTotal.toFixed(2)}.`)
      }

      // Deduct from wallet via deposit with negative amount (use withdraw for fiat)
      const withdrawRes = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amount: cartTotal,
          assetSymbol: 'USD',
          destinationType: 'bank',
          destinationInfo: {
            bankName: 'Freedom Wheels Internal',
            accountHolder: 'Marketplace Purchase',
            accountNumber: 'FW-INTERNAL',
            routingNumber: '000000',
          },
          notes: `Marketplace purchase: ${cart.map((i) => `${i.name} x${i.quantity}`).join(', ')}`,
        }),
      })

      if (!withdrawRes.ok) {
        const errData = await withdrawRes.json()
        throw new Error(errData.error || 'Payment failed')
      }

      // Complete the withdrawal immediately
      const withdrawal = (await withdrawRes.json()).withdrawal
      await fetch('/api/wallet/withdraw', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId: withdrawal.id,
          status: 'completed',
        }),
      })

      // Add notifications
      addNotification({
        id: `notif_purchase_${Date.now()}`,
        title: 'Purchase Complete',
        message: `${cart.length} item(s) purchased for $${cartTotal.toFixed(2)} from the Marketplace`,
        read: false,
        createdAt: new Date().toISOString(),
      })

      addLog({
        id: `log_purchase_${Date.now()}`,
        title: 'Marketplace Purchase',
        desc: `$${cartTotal.toFixed(2)} — ${cart.map((i) => i.name).join(', ')}`,
        type: 'revenue',
        createdAt: new Date().toISOString(),
      })

      setCheckoutStep('success')

      // Dispatch engine bus event for purchase
      dispatch({ source: 'marketplace-engine', type: 'marketplace:purchase', target: ['wallet-engine', 'referral-engine'], payload: { amount: cartTotal, items: cart.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity })) }, meta: { value: cartTotal } })

      clearCart()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Checkout failed'
      setCheckoutError(message)
      setCheckoutStep('error')
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 fw-scrollbar overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-widest uppercase">
            Marketplace
          </h2>
          <p className="text-fw-dim text-sm font-mono">
            Curated engines, templates, and AI tools
          </p>
        </div>

        {/* Cart Button */}
        <Button
          onClick={() => setCartOpen(true)}
          className="bg-fw-accent/10 text-fw-accent border border-fw-accent/30 hover:bg-fw-accent/20 font-mono tracking-wider relative"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          CART
          {cartItemCount > 0 && (
            <span className="ml-2 bg-fw-accent text-fw-bg text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-fw-dim flex-shrink-0" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-fw-accent/10 text-fw-accent border border-fw-accent/30'
                : 'border border-fw-border text-fw-dim hover:border-fw-accent/20 hover:text-fw-text'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const inCart = isInCart(product.id)
          const qty = getCartQuantity(product.id)
          const justAddedThis = justAdded === product.id

          return (
            <Card
              key={product.id}
              className="bg-fw-surface border-fw-border hover:border-fw-accent/30 transition-colors group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-bold tracking-wider uppercase truncate">
                      {product.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="text-[9px] border-fw-accent/30 text-fw-accent mt-1"
                    >
                      {product.category}
                    </Badge>
                  </div>
                  {product.badge && (
                    <Badge className="text-[9px] bg-fw-gold/10 text-fw-gold border border-fw-gold/30 ml-2">
                      {product.badge}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-fw-dim leading-relaxed mb-3">
                  {aiDescriptions[product.id]
                    ? aiDescriptions[product.id].split('\n')[0]
                    : product.desc}
                </p>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(product.rating)
                            ? 'text-fw-gold fill-fw-gold'
                            : 'text-fw-border'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-fw-dim font-mono">
                    {product.rating} ({product.reviews})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold font-mono text-fw-text">
                    ${product.price}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => generateDescription(product.id, product.name)}
                      disabled={loadingAi === product.id}
                      variant="ghost"
                      size="sm"
                      className="text-fw-dim hover:text-fw-accent h-8 w-8 p-0"
                    >
                      <Brain className="w-3 h-3" />
                    </Button>

                    {inCart ? (
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => updateCartQuantity(product.id, qty - 1)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-fw-dim hover:text-fw-red"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-xs font-mono font-bold w-6 text-center">
                          {qty}
                        </span>
                        <Button
                          onClick={() => updateCartQuantity(product.id, qty + 1)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-fw-dim hover:text-fw-green"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleAddToCart(product)}
                        size="sm"
                        className={`h-8 font-mono transition-all ${
                          justAddedThis
                            ? 'bg-fw-green/20 text-fw-green border border-fw-green/30'
                            : 'bg-fw-accent/10 text-fw-accent border border-fw-accent/30 hover:bg-fw-accent/20'
                        }`}
                      >
                        {justAddedThis ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Added
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Cart Sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="bg-fw-surface border-fw-border w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-fw-text font-mono tracking-widest text-sm uppercase flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-fw-accent" />
              Shopping Cart
              {cartItemCount > 0 && (
                <Badge className="bg-fw-accent/10 text-fw-accent border border-fw-accent/30 text-[9px]">
                  {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
              <Package className="w-12 h-12 text-fw-dim/30" />
              <p className="text-sm font-mono text-fw-dim">Your cart is empty</p>
              <p className="text-xs text-fw-dim/60">Browse the marketplace and add items</p>
              <Button
                onClick={() => setCartOpen(false)}
                variant="ghost"
                className="text-fw-accent font-mono mt-2"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto fw-scrollbar py-4 space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-fw-border bg-fw-bg/50 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold font-mono tracking-wider uppercase truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="outline"
                            className="text-[8px] border-fw-accent/20 text-fw-accent"
                          >
                            {item.category}
                          </Badge>
                          {item.badge && (
                            <Badge className="text-[8px] bg-fw-gold/10 text-fw-gold border border-fw-gold/20">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => removeFromCart(item.id)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-fw-dim hover:text-fw-red"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 border border-fw-border text-fw-dim"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-xs font-mono font-bold w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 border border-fw-border text-fw-dim"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <span className="text-sm font-bold font-mono text-fw-text">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Footer */}
              <div className="border-t border-fw-border pt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-fw-dim">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono text-fw-dim">
                    <span>Processing Fee</span>
                    <span className="text-fw-green">$0.00</span>
                  </div>
                  <Separator className="bg-fw-border" />
                  <div className="flex justify-between text-sm font-bold font-mono">
                    <span>Total</span>
                    <span className="text-fw-gold">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg border border-fw-gold/20 bg-fw-gold/5">
                  <Wallet className="w-4 h-4 text-fw-gold flex-shrink-0" />
                  <p className="text-[10px] font-mono text-fw-gold">
                    Payment will be deducted from your Freedom Wheels wallet balance
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={clearCart}
                    variant="ghost"
                    className="text-fw-dim font-mono flex-1"
                  >
                    Clear Cart
                  </Button>
                  <Button
                    onClick={() => {
                      setCartOpen(false)
                      setCheckoutDialog(true)
                      setCheckoutStep('review')
                    }}
                    className="bg-fw-gold text-fw-bg hover:bg-fw-gold/90 font-mono tracking-wider flex-1"
                  >
                    Checkout
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog */}
      <Dialog
        open={checkoutDialog}
        onOpenChange={(open) => {
          if (!open && checkoutStep !== 'processing') {
            setCheckoutDialog(false)
          }
        }}
      >
        <DialogContent className="bg-fw-surface border-fw-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-fw-text font-mono tracking-widest text-sm uppercase flex items-center gap-2">
              <Wallet className="w-4 h-4 text-fw-gold" />
              {checkoutStep === 'review' && 'Confirm Purchase'}
              {checkoutStep === 'processing' && 'Processing Payment...'}
              {checkoutStep === 'success' && 'Purchase Complete'}
              {checkoutStep === 'error' && 'Payment Failed'}
            </DialogTitle>
          </DialogHeader>

          {/* Review Step */}
          {checkoutStep === 'review' && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2 max-h-48 overflow-y-auto fw-scrollbar">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs font-mono py-1"
                  >
                    <span className="text-fw-text truncate flex-1">
                      {item.name} <span className="text-fw-dim">x{item.quantity}</span>
                    </span>
                    <span className="text-fw-text ml-2">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <Separator className="bg-fw-border" />
              <div className="flex justify-between text-sm font-bold font-mono">
                <span>Total</span>
                <span className="text-fw-gold">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                <Wallet className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] font-mono text-yellow-500/90">
                  ${cartTotal.toFixed(2)} will be deducted from your wallet balance. This action cannot be undone.
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setCheckoutDialog(false)}
                  className="text-fw-dim font-mono"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCheckout}
                  className="bg-fw-gold text-fw-bg hover:bg-fw-gold/90 font-mono tracking-wider"
                >
                  Pay ${cartTotal.toFixed(2)}
                  <Wallet className="w-4 h-4 ml-1" />
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Processing */}
          {checkoutStep === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-fw-gold animate-spin mx-auto" />
              <p className="text-sm font-mono text-fw-text tracking-wider">
                Processing your payment...
              </p>
              <p className="text-xs font-mono text-fw-dim">
                Deducting ${cartTotal.toFixed(2)} from your wallet
              </p>
            </div>
          )}

          {/* Success */}
          {checkoutStep === 'success' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-fw-green/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-fw-green" />
              </div>
              <div>
                <p className="text-sm font-mono text-fw-text tracking-wider font-bold">
                  Purchase Successful!
                </p>
                <p className="text-xs font-mono text-fw-dim mt-1">
                  ${cartTotal.toFixed(2)} has been deducted from your wallet. Your items are now active.
                </p>
              </div>
              <Button
                onClick={() => setCheckoutDialog(false)}
                className="bg-fw-gold/10 text-fw-gold border border-fw-gold/30 hover:bg-fw-gold/20 font-mono"
              >
                Done
              </Button>
            </div>
          )}

          {/* Error */}
          {checkoutStep === 'error' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-fw-red/10 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-fw-red" />
              </div>
              <div>
                <p className="text-sm font-mono text-fw-text tracking-wider font-bold">
                  Payment Failed
                </p>
                <p className="text-xs font-mono text-fw-red mt-1">{checkoutError}</p>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <Button
                  variant="ghost"
                  onClick={() => setCheckoutDialog(false)}
                  className="text-fw-dim font-mono"
                >
                  Close
                </Button>
                <Button
                  onClick={() => setCheckoutStep('review')}
                  className="bg-fw-gold/10 text-fw-gold border border-fw-gold/30 hover:bg-fw-gold/20 font-mono"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
