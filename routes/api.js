var express = require('express');
var router = express.Router();

/* GET tasks listing. */
router.get('/tasks/:task_id', function(req, res, next) {
  console.log(req.params);
  console.log(req.session);
  res.send('respond with a resource');
});

module.exports = router;
