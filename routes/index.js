const userRoutes = require('./user.routes')

const routesMount = (app) => {
    app.use('/api/v1/user', userRoutes)
}
module.exports = routesMount