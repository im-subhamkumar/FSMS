import express from 'express';
import studentsRouter from './routes/students.js';

const app = express();
app.use('/api/students', studentsRouter);

app._router.stack.forEach((middleware) => {
  if (middleware.route) { // routes registered directly on the app
      console.log(middleware.route);
  } else if (middleware.name === 'router') { // router middleware
      middleware.handle.stack.forEach((handler) => {
          let route;
          route = handler.route;
          if (route) {
              console.log(`${Object.keys(route.methods)[0].toUpperCase()} ${route.path}`);
          }
      });
  }
});
