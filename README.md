# NodeJs_HTTP

1. New users can be created, their information can be edited, and they can be deleted. We store their name, email address, and street address.

POST: http://localhost:3000/users 
{"firstName" : "*****","lastName": "******","email": "*******","password":"********","address": "*********"}

GET : http://localhost:3000/users?email=

PUT : http://localhost:3000/users

Delete : http://localhost:3000/users?email=

2. Users can log in and log out by creating or destroying a token.

POST: http://localhost:3000/tokens

{ "email" : "***********","password": "*********"}

3. When a user is logged in, they are able to GET all the possible menu items (these items are hardcoded in menu.js). 

GET: http://localhost:3000/menu
Headers:
content-type - application/json
token - ********

4. A logged-in user is able to fill a shopping cart with menu items

PUT: http://localhost:3000/addtoCart
Headers:
content-type - application/json
token - ********

{ "email": "*******","itemid": "100003","itemquantity": 4}

GET: http://localhost:3000/addtoCast?email=
Headers:
content-type - application/json
token - ********

5. A logged-in user is able to create an order. Integrated with the Sandbox of Stripe.com to accept their payment. 

POST: http://localhost:3000/createOrder
Headers:
content-type - application/json
token - ********

6. When an order is placed, the receipt is emailed to user. Integrated with the sandbox of Mailgun.com. 
