import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Mapping from Firebase config keys to NEXT_PUBLIC_ env variable names
const CONFIG_MAP: Record<string, string> = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
  measurementId: 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
}

// Keys that are required
const REQUIRED_KEYS = ['apiKey', 'projectId']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { config } = body

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { error: 'Invalid config. Please paste your Firebase config object.' },
        { status: 400 }
      )
    }

    // Validate required keys
    for (const key of REQUIRED_KEYS) {
      if (!config[key] || typeof config[key] !== 'string') {
        return NextResponse.json(
          { error: `Missing required key: ${key}. Make sure you copied the full firebaseConfig from Firebase Console.` },
          { status: 400 }
        )
      }
    }

    // Read existing .env.local
    const envPath = join(process.cwd(), '.env.local')
    let envContent = ''

    if (existsSync(envPath)) {
      envContent = readFileSync(envPath, 'utf-8')
    }

    // Update or add each config value
    for (const [firebaseKey, envKey] of Object.entries(CONFIG_MAP)) {
      const value = config[firebaseKey]
      if (value && typeof value === 'string') {
        const linePattern = new RegExp(`^${envKey}=.*$`, 'm')
        const newLine = `${envKey}=${value}`

        if (linePattern.test(envContent)) {
          envContent = envContent.replace(linePattern, newLine)
        } else {
          // Add new line
          if (!envContent.endsWith('\n')) {
            envContent += '\n'
          }
          envContent += newLine + '\n'
        }
      }
    }

    // Ensure founder email is set
    const founderLinePattern = /^NEXT_PUBLIC_FOUNDER_EMAIL=.*$/m
    const founderLine = `NEXT_PUBLIC_FOUNDER_EMAIL=malatjimaphalle1@gmail.com`
    if (founderLinePattern.test(envContent)) {
      envContent = envContent.replace(founderLinePattern, founderLine)
    } else {
      if (!envContent.endsWith('\n')) {
        envContent += '\n'
      }
      envContent += founderLine + '\n'
    }

    // Write back
    writeFileSync(envPath, envContent, 'utf-8')

    return NextResponse.json({
      success: true,
      message: 'Firebase configuration saved! Please wait while the app reloads...',
      savedKeys: Object.keys(CONFIG_MAP).filter((k) => config[k]),
    })
  } catch (error) {
    console.error('Error saving Firebase config:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration. Please check file permissions.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Return current Firebase config status (without revealing actual values)
  const envPath = join(process.cwd(), '.env.local')

  if (!existsSync(envPath)) {
    return NextResponse.json({ configured: false, keys: [] })
  }

  const envContent = readFileSync(envPath, 'utf-8')
  const configuredKeys: string[] = []

  for (const [firebaseKey, envKey] of Object.entries(CONFIG_MAP)) {
    const match = envContent.match(new RegExp(`^${envKey}=(.+)$`, 'm'))
    if (match && match[1] && !match[1].includes('YOUR_') && !match[1].includes('Replace-With') && !match[1].includes('Demo')) {
      configuredKeys.push(firebaseKey)
    }
  }

  return NextResponse.json({
    configured: configuredKeys.length >= REQUIRED_KEYS.length,
    keys: configuredKeys,
    total: Object.keys(CONFIG_MAP).length,
  })
}
