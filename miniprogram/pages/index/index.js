const app = getApp()
const db = wx.cloud.database()
const db_book = db.collection('mybooks')
global.regeneratorRuntime = require('../../lib/regenerator/runtime-module')
const { regeneratorRuntime } = global
import Notify from '../../miniprogram_npm/vant-weapp/notify/notify.js'

Page({
  data: {},

  onLoad: function() {
    if (!wx.cloud) {
      console.log('未开启云开发')
      return
    }
    wx.cloud.callFunction({
      name: 'login',
      complete: res => {
        app.globalData.openid = res.result.openid
        console.log('云函数获取到的openid: ', res.result.openid)
      }
    })
  },
  // 扫码
  async scan() {
    const isbn = await new Promise(function(resolve, reject) {
      wx.scanCode({
        scanType: ['barCode'],
        success: function (res) {
          resolve(res.result)
        },
        fail: function (err) {
          reject(err)
        }
      })
    })
    console.log('扫码结果', isbn)
    const isExist = await this.checkBook(isbn)
    if (isExist && isExist !== 'updated') {
      Notify({
        text: '图书已存在',
        duration: 1000,
        selector: '#custom-selector',
        backgroundColor: 'red'
      })
      return
    }
    if (isExist && isExist === 'updated') {
      Notify({
        text: '添加成功',
        duration: 1000,
        selector: '#custom-selector',
        backgroundColor: 'green'
      })
      return
    } // 已更新

    wx.cloud.callFunction({
      name: 'bookinfo',
      data: { isbn },
      // data: { isbn: '9787101003048'},
      success: res => {
        console.log('res', res.result)
        db_book.add({
          data: Object.assign(res.result, {openids: [app.globalData.openid]})
        }).then(res => {
          Notify({
            text: '添加成功',
            duration: 1000,
            selector: '#custom-selector',
            backgroundColor: 'green'
          })
          console.log(res)
        }).catch(err => {
          console.log(err)
        })
      },
      fail: err => {
        Notify({
          text: '图书获取超时或不存在',
          duration: 1000,
          selector: '#custom-selector',
          backgroundColor: 'red'
        })
      }
    })
  },

  // 根据isbn查询
  async checkBook(isbn) {
    const bookResult = await db.collection('mybooks').where({isbn})
    .get()
    console.log('book', bookResult)
    if (bookResult.data && bookResult.data.length) {
      const book = bookResult.data[0]
      console.log(book.openids)
      console.log(app.globalData.openid)
      if (book.openids.includes(app.globalData.openid)) return !!(bookResult.data && bookResult.data.length)
      // 更新
      db_book.doc(book._id).update({
        data: {
          openids: db.command.push([app.globalData.openid])
        }
      })
      return 'updated'
    }
  }

})
