const express =  require ("express");
const bodyParser = require('body-parser');
const passport = require('passport');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

const users = require('./routes/users');
const tokenWallet = require('./routes/token-wallet');

app.use('/users', users);
app.use('/token-wallet', tokenWallet)

app.listen(5000, () => {
    console.log("App is listening on port 5000");
});


