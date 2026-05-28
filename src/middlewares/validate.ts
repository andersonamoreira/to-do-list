import { ZodSchema } from 'zod'
import { Request, Response, NextFunction } from 'express'

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(422).json({
        error: 'Dados inválidos',
        details: result.error.errors,
      })
      return
    }
    req.body = result.data
    next()
  }
}
