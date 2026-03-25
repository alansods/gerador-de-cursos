import { FlatCompat } from '@eslint/eslintrc'
import { globalIgnores } from 'eslint/config'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'player/dist/**']),
]

export default eslintConfig
