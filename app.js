const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1)GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors());
// Access-Control-Allow-Origin
// api.natours.com, natours.com

app.options('*', cors()); // respond to http request other than get or post

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100, // maxx number of requests allowed
  windowMs: 60 * 60 * 1000, // 1 hour window, that is if crossed 100 request it will prompt an error message and then user have to wait for 1 hour
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter); // apply to route that start with /api

app.post(
  '/webhook-checkout',
  express.raw({ type: 'application / json' }),
  bookingController.webhookCheckout
); // this is not needed in json

// Body parser, reading data from body req.body
app.use(express.json({ limit: '10kb' })); // it will limit data of body to take only 10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // extended allows us to pass some complex data
app.use(cookieParser());

// Data sanitizaion against NoSQL query injection
app.use(mongoSanitize()); // it will basically look after body and params and filter out $ signs and . (dots) to prevent NoSQL attacks

// Data sanitization against XSS
app.use(xss()); // it will clean any user input from malicious html code

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
); // we are allowing duplicates for these query strings

// Will compress all the text that is sent to the client
app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); // convert date and time to readable string
  // console.log(req.cookies);
  next();
});

// 2) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// if any request reached this point of code that means it wasn't handled by any of the above router functions, because middleware executes line by line
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); // it will skip all other middleware and go directly to error handling middleware
}); // all and star for every route

app.use(globalErrorHandler); // express automatically knows it is an error handling middleware, error first middleware, first argument is error

module.exports = app;
