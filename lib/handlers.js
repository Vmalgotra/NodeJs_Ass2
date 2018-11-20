/*
 * Request Handlers
 *
 */

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');
var menu = require('./menu');

const Mailgun = require('mailgun-js');

var stripe = require('stripe')("sk_test_kCjWjPDbJ8XiNFfoMHKg1vGY");
const mailgunKey = '3ax6xnjp29jd6fds4gc373sgvjxteol0';
const mailgunDomain = "sandbox196d8747e6b2408dabb7010893bd148b.mailgun.org";
const mailgunFrom = 'bmaibach@gmail.com';

// Define all the handlers
var handlers = {};

// Ping
handlers.ping = function (data, callback) {
  setTimeout(function () {
    callback(200);
  }, 5000);

};

// Not-Found
handlers.notFound = function (data, callback) {
  callback(404);
};

// Users
handlers.users = function (data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the users methods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function (data, callback) {
  // Check that all required fields are filled out
  var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var address = typeof (data.payload.address) == 'string' && data.payload.address.trim().length < 20 ? data.payload.address.trim() : false;

  if (firstName && lastName && email && password && address) {
    // Make sure the user doesnt already exist
    _data.read('users', email, function (err, data) {
      if (err) {
        // Hash the password
        var hashedPassword = helpers.hash(password);

        // Create the user object
        if (hashedPassword) {
          var userObject = {
            'firstName': firstName,
            'lastName': lastName,
            'email': email,
            'hashedPassword': hashedPassword,
            'address': address
          };

          // Store the user
          _data.create('users', email, userObject, function (err) {
            if (!err) {
              _data.create('cart', email, { 'items': [] }, function (err) {
                if (!err) {
                  _data.create('orders', email, {}, function (err) {
                    if (!err) {
                      callback(200);
                    } else {
                      callback(500, { 'Error': 'Could not create the  order file' });
                    }
                  });
                } else {
                  callback(500, { 'Error': 'Could not create the  user cart' });
                }
              });

            } else {
              callback(500, { 'Error': 'Could not create the new user' });
            }
          });
        } else {
          callback(500, { 'Error': 'Could not hash the user\'s password.' });
        }

      } else {
        // User alread exists
        callback(400, { 'Error': 'A user with that Email ID already exists' });
      }
    });

  } else {
    callback(400, { 'Error': 'Missing required fields' });
  }

};

// Required data: phone
// Optional data: none
handlers._users.get = function (data, callback) {
  // Check that phone number is valid
  var email = typeof (data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
  if (email) {

    // Get token from headers
    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, email, function (tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        _data.read('users', email, function (err, data) {
          if (!err && data) {
            // Remove the hashed password from the user user object before returning it to the requester
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, { "Error": "Missing required token in header, or token is invalid." })
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field' })
  }
};

// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = function (data, callback) {
  // Check for required field
  var email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;

  // Check for optional fields
  var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var address = typeof (data.payload.address) == 'string' && data.payload.address.trim().length < 20 ? data.payload.address.trim() : false;

  // Error if phone is invalid
  if (email) {
    // Error if nothing is sent to update
    if (firstName || lastName || password || address) {

      // Get token from headers
      var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

      // Verify that the given token is valid for the phone number
      handlers._tokens.verifyToken(token, email, function (tokenIsValid) {
        if (tokenIsValid) {

          // Lookup the user
          _data.read('users', email, function (err, userData) {
            if (!err && userData) {
              // Update the fields if necessary
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }
              if (address) {
                userData.address = address;
              }
              // Store the new updates
              _data.update('users', email, userData, function (err) {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { 'Error': 'Could not update the user.' });
                }
              });
            } else {
              callback(400, { 'Error': 'Specified user does not exist.' });
            }
          });
        } else {
          callback(403, { "Error": "Missing required token in header, or token is invalid." });
        }
      });
    } else {
      callback(400, { 'Error': 'Missing fields to update.' });
    }
  } else {
    callback(400, { 'Error': 'Missing required field.' });
  }

};

// Required data: phone
// Cleanup old checks associated with the user
handlers._users.delete = function (data, callback) {
  // Check that phone number is valid
  var email = typeof (data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
  if (phone) {

    // Get token from headers
    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, email, function (tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        _data.read('users', email, function (err, userData) {
          if (!err && userData) {
            // Delete the user's data
            _data.delete('users', email, function (err) {
              if (!err) {
                // Delete each of the checks associated with the user
                var userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                var checksToDelete = userChecks.length;
                if (checksToDelete > 0) {
                  var checksDeleted = 0;
                  var deletionErrors = false;
                  // Loop through the checks
                  userChecks.forEach(function (checkId) {
                    // Delete the check
                    _data.delete('checks', checkId, function (err) {
                      if (err) {
                        deletionErrors = true;
                      }
                      checksDeleted++;
                      if (checksDeleted == checksToDelete) {
                        if (!deletionErrors) {
                          callback(200);
                        } else {
                          callback(500, { 'Error': "Errors encountered while attempting to delete all of the user's checks. All checks may not have been deleted from the system successfully." })
                        }
                      }
                    });
                  });
                } else {
                  callback(200);
                }
              } else {
                callback(500, { 'Error': 'Could not delete the specified user' });
              }
            });
          } else {
            callback(400, { 'Error': 'Could not find the specified user.' });
          }
        });
      } else {
        callback(403, { "Error": "Missing required token in header, or token is invalid." });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field' })
  }
};

// Tokens
handlers.tokens = function (data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens methods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function (data, callback) {
  var email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (email && password) {
    // Lookup the user who matches that phone number
    _data.read('users', email, function (err, userData) {
      if (!err && userData) {
        // Hash the sent password, and compare it to the password stored in the user object
        var hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // If valid, create a new token with a random name. Set an expiration date 1 hour in the future.
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            'email': email,
            'id': tokenId,
            'expires': expires
          };

          // Store the token
          _data.create('tokens', tokenId, tokenObject, function (err) {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { 'Error': 'Could not create the new token' });
            }
          });
        } else {
          callback(400, { 'Error': 'Password did not match the specified user\'s stored password' });
        }
      } else {
        callback(400, { 'Error': 'Could not find the specified user.' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field(s).' })
  }
};

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = function (data, callback) {
  // Check that id is valid
  var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    // Lookup the token
    _data.read('tokens', id, function (err, tokenData) {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field, or field invalid' })
  }
};

// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function (data, callback) {
  var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
  if (id && extend) {
    // Lookup the existing token
    _data.read('tokens', id, function (err, tokenData) {
      if (!err && tokenData) {
        // Check to make sure the token isn't already expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          // Store the new updates
          _data.update('tokens', id, tokenData, function (err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, { 'Error': 'Could not update the token\'s expiration.' });
            }
          });
        } else {
          callback(400, { "Error": "The token has already expired, and cannot be extended." });
        }
      } else {
        callback(400, { 'Error': 'Specified user does not exist.' });
      }
    });
  } else {
    callback(400, { "Error": "Missing required field(s) or field(s) are invalid." });
  }
};


// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function (data, callback) {
  // Check that id is valid
  var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    // Lookup the token
    _data.read('tokens', id, function (err, tokenData) {
      if (!err && tokenData) {
        // Delete the token
        _data.delete('tokens', id, function (err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { 'Error': 'Could not delete the specified token' });
          }
        });
      } else {
        callback(400, { 'Error': 'Could not find the specified token.' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field' })
  }
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function (id, email, callback) {
  // Lookup the token
  _data.read('tokens', id, function (err, tokenData) {
    if (!err && tokenData) {
      // Check that the token is for the given user and has not expired
      if (tokenData.email == email && tokenData.expires > Date.now()) {
        console.log('Email valid');
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};


handlers.menu = (data, callback) => {
  let acceptedMethods = ['get'];
  if (acceptedMethods.indexOf(data.method) > -1) {
    console.log('h');
    callback(200, { 'items': menu.items });
  } else {
    callback(405, { 'error': 'Unsupported method' });
  }
};



// Checks
handlers.addtoCart = function (data, callback) {
  var acceptableMethods = ['put', 'get'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._addtoCart[data.method](data, callback);
  } else {
    callback(405);
  }
};
handlers._addtoCart = {};

handlers._addtoCart.put = function (data, callback) {
  // Check for required field
  var itemid = typeof (data.payload.itemid) == 'string' && data.payload.itemid.trim().length == 6 ? data.payload.itemid.trim() : false;
  var itemquantity = typeof (data.payload.itemquantity) == 'number' ? data.payload.itemquantity : false;
  var email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;



  // Error if id is invalid
  if (itemquantity && itemid && email) {
    // Error if nothing is sent to update
    // Lookup the chec
    // Get the token that sent the request
    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid and belongs to the user who created the check
    handlers._tokens.verifyToken(token, email, function (tokenIsValid) {
      if (tokenIsValid) {
        _data.read('cart', email, function (err, checkData) {
          if (!err && checkData) {
            //Create object to store
            var keys = [];
            for (let i = 0; i < checkData.items.length; i++) {
              keys[i] = checkData.items[i]['itemId'];
            }
            if (keys.indexOf(itemid) > -1) {

              let index = keys.indexOf(itemid);
              checkData.items[index]['itemquantity'] += itemquantity;

              if (checkData.items[index]['itemquantity'] <= 0) {

                let removedObject = checkData.items.splice(index, 1);
                removedObject = null;
              }
            } else {

              newItem = { 'itemId': itemid, 'itemquantity': itemquantity };
              checkData.items.push(newItem);
            }
            //console.log('updated',checkData.items[0]);
            //checkData.items.push[];
            _data.update('cart', email, checkData, function (err) {
              if (!err) {
                //console.log('updated',checkData);
                callback(200);
              } else {
                callback(500, { 'Error': 'Could not update the check.' });
              }
            });

          } else {
            callback(403);
          }
        });

      } else {
        callback(404, { 'Error': 'Invalid token' });
      }

    });
  }
  else {
    callback(404, { 'Error': 'Missing data' });
  }
};


handlers._addtoCart.get = function (data, callback) {
  var email = typeof (data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
  if (email) {
    // Get the token that sent the request
    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid and belongs to the user who created the check
    handlers._tokens.verifyToken(token, email, function (tokenIsValid) {
      if (tokenIsValid) {
        // Return check data
        _data.read('cart', email, function (err, userdata) {
          if (!err && userdata) {
            callback(200, userdata.items);
          } else {
            callback('Error getting cart details');
          }
        })
        //callback(200,checkData);
      } else {
        callback(403, { 'Error': 'Token Invalid' });
      }
    });
  } else {
    callback(404, { 'Error': 'Missing Fields' });
  }
};


// Checks
handlers.createOrder = function (data, callback) {
  var acceptableMethods = ['post'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._createOrder[data.method](data, callback);
  } else {
    callback(405);
  }
};
handlers._createOrder = {};

handlers._createOrder.post = function (data, callback) {
  // Check for required field
  var email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  // Error if id is invalid
  if (email) {
    // Error if nothing is sent to update
    // Lookup the chec
    // Get the token that sent the request
    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid and belongs to the user who created the check
    handlers._tokens.verifyToken(token, email, function (tokenIsValid) {
      if (tokenIsValid) {

        _data.read('cart', email, function (err, order) {

          if (!err && order.items.length > 0) {

            _data.update('orders', email, order, function (err) {

              if (!err) {
                //clear the cart

                _data.update('cart', email, { 'items': [] }, function (err) {
                  if (!err) {
                    let totalprice = 0;
                    if (!err) {
                      for (let i = 0; i < order.items.length; i++) {
                        let a = menu.getItemPrice(order.items[i].itemId);
                        totalprice += order.items[i].itemquantity * a;
                      }
                      totalprice = Math.floor(totalprice);
                      console.log(totalprice);
                      try {

                        charge = stripe.charges.create({
                          amount: totalprice,
                          currency: 'usd',
                          source: 'tok_visa'
                        });

                      } catch (error) {
                        console.log(error);
                        callback(500, { 'error': 'The charge could not be made' });
                      }
                      try {

                        //We pass the api_key and domain to the wrapper, or it won't be able to identify + send emails
                        var mailgun = new Mailgun({ apiKey: mailgunKey, domain: mailgunDomain });

                        var data = {
                          //Specify email data
                          from: mailgunFrom,
                          //The email to contact
                          to: 'vmalgotra@gmail.com',
                          //Subject and text data  
                          subject: 'Thank you - Your purchase has been processed',
                          html: 'Thank you for your purchase of ' + JSON.stringify(order.items) + ' totalling $' + totalprice
                        }
                        console.log(JSON.stringify(data));
                        //Invokes the method to send emails given the above data with the helper library
                        mailgun.messages().send(data, function (err, body) {
                          //If there is an error, render the error page
                          if (err) {

                            console.log(err);
                            throw err;
                          }
                          else {
                            console.log(body);
                          }
                        });

                        callback(200, { 'charge': totalprice });
                      } catch (error) {
                        console.log(error)
                          ; callback(500, { 'error': 'There was a problem generating your receipt, please contact support' });
                      }



                    } else {
                      callback(404, { 'Error': 'Fetching menu details' });
                    }


                    //callback(200, { 'totalprice': totalprice });
                  } else {
                    callback(404, { 'Error': 'Clearing the cart' });
                  }
                });

              } else {
                callback(404, { 'Error': 'Could not post the order' })
              }
            });

          } else {
            callback(404, { 'Error': 'No orders in the cart' });
          }

        });

      } else {
        callback(404, { 'Error': 'Invalid token' });
      }

    });
  }
  else {
    callback(404, { 'Error': 'Missing data' });
  }
};

// Export the handlers
module.exports = handlers;
