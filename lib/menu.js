let menu = {}

menu.items = [
        {
            "id": "100000",
            "name": "3 Chicken Wings",
            "description": "Tender, Spicy and Juicy. Original or Peri-Crusted",
            'price' : 11.99,
        },
        {
            "id": "100001",
            "name": "Pound of Wings",
            "description": "Nuff said",
            'price' : 12.99,
        },
        {
            'id' : '100002',
            'name' : 'Pasta',
            'description' : 'Served el dente with marinara sauce',
            'price' : 13.99,
        },
        {
            'id' : '100003',
            'name' : 'Lasagna',
            'description' : 'Just like your mama used to make, served with garlic bread',
            'price' : 11.99,
        }
]

menu.getItemPrice = function(sku) {
    let price = 0;
    menu.items.forEach((item) => {
        if(item.id == sku){
            price = item.price;
        }
    });
    console.log('kk'+price);
    return price;
}



module.exports = menu;
