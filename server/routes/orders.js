/*
* router for orders
*/

const Router = require('koa-router');
const router = new Router();
const Orders = require('../models/Orders')
const Restaurant = require('../models/Restaurant')
const Orders_item = require('../models/Orders_item')
const Sequelize = require('sequelize')
const Food = require('../models/Food')
const Op = Sequelize.Op;

const routePlanning = require('../Gmaps/route')

router.get('/order', async (ctx) => {
    if (!ctx.query.orders_id && !ctx.query.customer_id) {
        ctx.body = {
            status: false,
            description: 'Need orders_id or customer_id'
        }
        return
    }

    // return single instance
    if (ctx.query.orders_id) {
        try {
            let queryOrder = await Orders.findById(ctx.query.orders_id)
            let queryItems = await Orders_item.findAll({
                where: {
                    orders_id: order.orders_id
                }
            })
            ctx.body = {
                order: queryOrder,
                items: queryItems
            }
        } catch (err) {
            console.log(err)
            ctx.body = {
                status: false,
                description: err
            }
        }
        return
    }

    // return an array of items, ordered by DESC order time
    if (ctx.query.customer_id) {
        try {
            let orders = await Orders.findAll({
                where: {
                    customer_id: ctx.query.customer_id
                },
                order: 'order_time DESC'
            })
            ctx.body = orders
        } catch (err) {
            console.log(err)
            ctx.body = {
                status: false,
                description: err
            }
        }
    }
})

router.post('/order', async (ctx) => {
    if (!ctx.request.body) {
        ctx.status = 400
        ctx.body = {
            status: false,
            description: `no expected object received, the post data: ${ctx.request.body}`
        }
        return
    }

    try {
        let recv = ctx.request.body
        ctx.body = recv
        
        let order = await Orders.create({
            orders_id: Math.random().toString().substr(13),
            customer_id: ctx.request.body.customer_id,
            total_price: ctx.request.body.total_price,
            address: ctx.request.body.address
        })

        let createdItem = null
        let items = ctx.request.body.items

        for(j = 0; items[j] != null; j++) {
            console.log(items[j])
            createdItem = await Orders_item.create({
                orders_id: order.orders_id,
                item_id: items[j].item_id,
                quantity: items[j].quantity,
                subtotal: items[j].subtotal
            })
        }

        let rest = await Food.findOne({
            where: {
                item_id: createdItem.item_id
            }
        })
    
        let restaurant = await Restaurant.findOne({
            where: {
                restaurant_id: rest.restaurant_id
            }
        })

        routePlanning(restaurant.address, order.address)

        ctx.body = order
        
    } catch (err) {
        console.log(err)
        ctx.body = {
            status: false,
            description: err
        }
    }
})














module.exports = router