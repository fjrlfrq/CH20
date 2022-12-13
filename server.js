const express = require('express')
const bodyParser = require('body-parser')
const sqlite3 = require('sqlite3');
const moment = require('moment')

const path = require('path');
const { runInNewContext } = require('vm');

const pathDB = path.join(path.resolve(), 'db', 'database.db');
const db = new sqlite3.Database(pathDB);

const port = 3000

const app = express()

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

//template engine
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
  //searching
  const params = []
  const values = []
  let counter = 1

  if (req.query.id) {
    params.push(`id = $${counter++}`)
    values.push(req.query.id);
  }
  
  if (req.query.string && req.query.stringc){
    params.push(`string like '%' || ? || '%'`)
    // params.push(`string = $${counter++}`)
    values.push(req.query.string);
  }

  if (req.query.integer && req.query.integerc) {
    params.push(`integer = ?`)
    values.push(req.query.integer);
  }

  if (req.query.float && req.query.floatc) {
    params.push(`float = $${counter++}`)
    values.push(req.query.float);
  }

  if (req.query.daten && req.query.datenc) {
    params.push(`daten = $${counter++}`)
    values.push(req.query.daten);
  }

  if (req.query.boolean && req.query.booleanc) {
    params.push(`boolean = $${counter++}`)
    values.push(req.query.boolean);
  }

  const page = req.query.page || 1
  const limit = 3
  const offset = (page - 1) * limit

  let sql = `SELECT COUNT(*) AS total FROM Bread`
  if (params.length > 0) 
    sql += ` WHERE ${params.join(' AND ')}`

  db.all(sql, values, (err, data) => {
    if (err) return console.log('gagal ambil data', err)
    const total = data[0].total
    const pages = Math.ceil(total / limit)

    sql = `SELECT * FROM Bread`
    if (params.length > 0) 
      sql += ` WHERE ${params.join(` AND `)}`

      sql += ` LIMIT $${counter++} OFFSET $${counter++}`
    
    db.all(sql, [...values, limit, offset], (err, rows) => {
      if (err) return console.log('gagal ambil data', err)
      res.render('index', { daftar: rows, moment, page, pages, offset, query: req.query })
    })
  })
})

app.get('/add', (req, res) => {
  res.render('add')
})

app.post('/add', (req, res) => {
  const { string, integer, float, daten, boolean } = req.body
  db.run(`INSERT INTO Bread (string,integer,float,daten,boolean) VALUES (?,?,?,?,?)`, [string, integer, float, daten, boolean], (err) => {
    if (err) return console.log('gagal ambil data', err)
    res.redirect('/')
  })
})

app.get('/delete/:id', (req, res) => {
  const index = req.params.id
  db.run(`DELETE FROM Bread WHERE id=?`, [index], (err) => {
    if (err) return console.log('gagal ambil data', err)
    res.redirect('/')
  })
})

app.get('/edit/:id', (req, res) => {
  const index = req.params.id
  db.get(`SELECT * FROM Bread;`, (err, row) => {
    if (err) return console.log('gagal ambil data', err)
    res.render('edit', { index, data: row })

  })
})

app.post('/edit/:id', (req, res) => {
  const index = req.params.id
  const { string, integer, float, daten, boolean } = req.body
  db.run(`UPDATE Bread set string=?, integer=?, float=?, daten=?, boolean=? where id=?;`, [string, integer, float, daten, boolean, index], (err, rows) => {
    if (err) return console.log('gagal ambil data', err)
    res.redirect('/')
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})