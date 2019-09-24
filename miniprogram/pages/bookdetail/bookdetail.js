// pages/bookdetail/bookdetail.js
Page({
  data: {
    bookDetail: {}
  },

  onLoad: function (options) {
    const that = this
    const eventChannel = this.getOpenerEventChannel()
    // 监听acceptDataFromOpenerPage事件，获取上一页面通过eventChannel传送到当前页面的数据
    eventChannel.on('acceptDataFromOpenerPage', function (data) {
      that.setData({
        bookDetail: data
      })
      console.log('data', data)
    })
  },

})