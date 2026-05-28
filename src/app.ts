import express from 'express'
import { authRouter } from './routes/auth.js'
import { usersRouter } from './routes/users.js'
import { projectsRouter } from './routes/projects.js'
import { tasksRouter } from './routes/tasks.js'
import { labelsRouter } from './routes/labels.js'

export function createApp() {
  const app = express()

  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/auth', authRouter)
  app.use('/users', usersRouter)
  app.use('/projects', projectsRouter)
  app.use('/labels', labelsRouter)
  app.use('/', tasksRouter)

  app.use((_req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' })
  })

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack)
    res.status(500).json({ error: 'Erro interno do servidor' })
  })

  return app
}
