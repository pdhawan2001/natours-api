const fs = require('fs');
const express = require('express');

const app = express();

app.use(express.json()); //middleware

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

app.get('/api/v1/tours/:id', (req, res) => {
  console.log(req.params);
  const id = req.params.id * 1; // convert string to a number
  const tour = tours.find(el => el.id === id);

  // if(id>tours.length) {
  if(!tour){
    return res.status(400).json({
      status: 'fail',
      message: 'invalid ID',
    })
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

app.post('/api/v1/tours', (req, res) => {
  // console.log(req.body);
  const newId = tours[tours.length - 1].id + 1;
  const newTour = { id: newId, ...req.body }; // create new object by merging two object together

  tours.push(newTour);
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
});

app.patch('/api/v1/tours/:id', (req, res) => {

  if(req.params.id*1>tours.length){
    return res.status(400).json({
      status: 'fail',
      message: 'invalid ID',
    })
  }
  res.status(200).json({
    staurs: 'success',
    data: {
      tour: '<Updated tour here...'
    }
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
