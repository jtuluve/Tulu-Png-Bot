//local process env
require('dotenv').config();
//imports
const { Telegraf, Markup } = require("telegraf");
const { message } = require("telegraf/filters")
const sqlite3 = require("sqlite3").verbose();
const axios = require('axios');
const {transcript} = require("./transcript");
const {dbcreate, dbget, dbupdate} = require("./dbfunc")

//database
const db = new sqlite3.Database("userdata.db");

//ping png api
axios.get(`https://tulu-png-api.glitch.me/`)



//create userdata table if not exists
db.run(`CREATE TABLE IF NOT EXISTS userdata (userid INTEGER UNIQUE, color STRING DEFAULT 'red', font STRING DEFAULT baravu)`)
const bot = new Telegraf(process.env.BOT_TOKEN);
//const http = require('https');
// Bot code
//bot.telegram.setWebhook('https://mesquite-private-jay.glitch.me/');
bot.on(message, (ctx, next) => {
  dbcreate(ctx.chat.id);
  axios.get(`https://tulu-png-api.glitch.me/`)
  return next();
})
bot.command(["start"], (ctx) => {
  ctx.replyWithHTML(
    "<b>Hello there!! Read this before using the bot</b>\nI can send a png image in <b>Tulu script</b> if you provide the text in <b>Kannada or Malayalam script<?b>. \n You can select your own color and font. \nFor a list of available commands send /commands or /help.");
});


bot.command(["commands", "command", "help"], ctx => {
  ctx.replyWithMarkdownV2("*Here is a list of available commands and their  short description:*\n/start \\- Get started\\!\\!\n/image \\- Generate png image\n/setfont \\- Set font for png text\n/setcolor \\- set color for png text\n/myfont \\- currently selected font\n/mycolor \\- currently selected color\n/commands \\- get a list of available commands")
})

// Command to set user color
bot.command('setcolor', async (ctx) => {
  return await ctx.reply('choose color:', Markup.inlineKeyboard([
    [
      Markup.button.callback("black", "setcolor black"),
      Markup.button.callback("white", "setcolor white"),
      Markup.button.callback("red", "setcolor red"),
    ], [
      Markup.button.callback("green", "setcolor green"),
      Markup.button.callback("blue", "setcolor blue"),
      Markup.button.callback("yellow", "setcolor yellow")
    ], [
      Markup.button.callback("cyan", "setcolor cyan"),
      Markup.button.callback("gray", "setcolor gray"),
      Markup.button.callback("orange", "setcolor orange")
    ], [
      Markup.button.callback("brown", "setcolor brown"),
      Markup.button.callback("purple", "setcolor purple"),
      Markup.button.callback("pink", "setcolor pink")
    ], [
      Markup.button.callback("maroon", "setcolor maroon"),
      Markup.button.callback("violet", "setcolor violet"),
      Markup.button.callback("gold", "setcolor gold")
    ]
  ])
  )
});
//user color set action
bot.action(/setcolor (.+)/, async (ctx) => {
  await dbupdate(ctx.update.callback_query.from.id, ["color"], [ctx.match[1]])
  ctx.reply(`Your color has been updated to ${ctx.match[1]}`)
  return
})


bot.command("setfont", async (ctx) => {
  return await ctx.reply('choose font:', Markup.inlineKeyboard([
    [
      Markup.button.callback("baravu", "setfont baravu"),
      Markup.button.callback("mandara", "setfont mandara"),
      Markup.button.callback("allige", "setfont allige"),
    ]
  ])
  )
});

//user font set action
bot.action(/setfont (.+)/, (ctx) => {
  ctx.reply(`Your font has been updated to: ${ctx.match[1]}`)
  dbupdate(ctx.update.callback_query.from.id, ["font"], [ctx.match[1]])
  return
})

bot.command("mycolor", (ctx) => {
  dbget(ctx.message.from.id, (row) => {
    if (row)
      ctx.reply(`Your default png color is ${row.color||red}`)
    else ctx.reply("Your default png color is red")
  })
})

bot.command("myfont", (ctx) => {
  dbget(ctx.message.from.id, (row) => {
    if (row)
      ctx.reply(`Your default png font is ${row.font}`)
    else ctx.reply("Your default png font is baravu")
  })
})

bot.command("image", (ctx) => {
  
  ctx.reply("Send me the text in Kannada or Malyalam (in Tulu language) to get png image.")
})


bot.on(message("sticker"), (ctx) => ctx.reply("❤️"));

bot.on(message("text"), async (ctx) => {
  let msg = await bot.telegram.sendMessage(ctx.message.chat.id, "It will take some time for me to generate png. Please wait..😇")
  dbget(ctx.message.chat.id, async (row) => {
    let txt = ctx.message.text;

    txt = transcript(txt);
    txt = encodeURIComponent(txt);
    let color = row ? row.color : "red";
    let font = row ? row.font : "baravu";

    axios.get(`https://tulu-png-api.glitch.me/image?text=${txt}&font=${font}&color=${color}`)
      .then(async response => {
        await ctx.sendDocument({ url: response.data.url, filename: "image.png" });
        bot.telegram.deleteMessage(ctx.message.from.id, msg.message_id);
      })
      .catch(error => {
        console.error(error);
      });
  })
});
bot.launch({
  webhook:{
    domain: process.env.LINK,
    port: process.env.PORT
  }
})
  .then(() => {
    console.log("listening..")
  })

