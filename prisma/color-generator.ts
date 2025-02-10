import { generatorHandler, GeneratorOptions } from '@prisma/generator-helper'
import { bulkAssignPatientColors } from '../src/lib/prisma-middleware'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs/promises'
import * as path from 'path'

const SCHEMA_PATH = './prisma/schema.prisma'

generatorHandler({
  onManifest() {
    return {
      defaultOutput: './generated',
      prettyName: 'Patient Color Generator',
    }
  },
  async onGenerate(options: GeneratorOptions) {
    try {
      // 1. Read the schema file
      const schemaPath = path.resolve(SCHEMA_PATH)
      const schema = await fs.readFile(schemaPath, 'utf-8')

      // 2. Check if we need to add the colorIndex field
      if (!schema.includes('colorIndex Int @default(1)')) {
        // Find the Patient model
        const patientModelMatch = schema.match(/model\s+Patient\s*{[\s\S]*?}/m)
        if (patientModelMatch) {
          const patientModel = patientModelMatch[0]
          // Add the colorIndex field before the closing brace
          const updatedModel = patientModel.replace(
            /}$/,
            '  colorIndex Int @default(1)\n}'
          )
          // Replace the old model with the updated one
          const updatedSchema = schema.replace(patientModelMatch[0], updatedModel)
          // Write back to the schema file
          await fs.writeFile(schemaPath, updatedSchema, 'utf-8')
          
          // Run prisma generate again to apply the schema change
          console.log('Added colorIndex field to Patient model. Running prisma generate...')
          const { exec } = require('child_process')
          await new Promise((resolve, reject) => {
            exec('npx prisma generate', (error: any) => {
              if (error) reject(error)
              else resolve(null)
            })
          })
        }
      }

      // 3. Run the color assignment
      console.log('Assigning colors to patients...')
      const prisma = new PrismaClient()
      await bulkAssignPatientColors(prisma)
      await prisma.$disconnect()
      
      console.log('Color assignment complete!')
    } catch (error) {
      console.error('Error in color generator:', error)
      throw error
    }
  }
}) 