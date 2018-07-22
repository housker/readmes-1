const Sequelize = require('sequelize');
const connection = require('./config.js');

// CONNECTION
var db = new Sequelize(connection.DBNAME, connection.DBUSERNAME, connection.DBPASSWORD, {
  host: connection.DBHOST,
  port: connection.DBPORT,
  dialect: 'mysql',
  // dialectOptions: {
  //   ssl: 'Amazon RDS'
  // }
});

db
  .authenticate()
  .then(() => {
    console.log('Connected to knowhow');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// MODELS
const Article = db.define('articles', {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: Sequelize.STRING, allowNull: false },
  description: { type: Sequelize.STRING, allowNull: false },
  content: {type: Sequelize.TEXT, allowNull: false}
});

const Category = db.define('categories', {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: Sequelize.STRING, allowNull: false },
  description: { type: Sequelize.STRING, allowNull: false }
});

const Company = db.define('companies', {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: Sequelize.STRING, allowNull: false },
  domain: { type: Sequelize.STRING, allowNull: false, unique: true }
});

// ASSOCIATIONS
Company.hasMany(Category, {
  foreignKey: {
    allowNull: false
  }
});

Category.belongsTo(Company, {
  allowNull: false
});

Category.hasMany(Article, {
  foreignKey: {
    allowNull: true
  }
})

Article.belongsTo(Category, {
  allowNull: true
})

Article.belongsTo(Company, {
  allowNull: false
})

Company.hasMany(Article, {
  foreignKey: {
    allowNull: false
  }
})

var assoc = () => {
  Company.sync().then(() => Category.sync().then(() => Article.sync()))
};

// HELPERS
module.exports = {

  addArticle: (obj, cb) => {
    Category.findOne({where: {name: 'Github READMEs'}}).then(foundCat => {
      console.log('========= foundCat ', foundCat)
      let newArt = Article.build({
        title: obj.title,
        description: obj.description,
        content: obj.content,
        companyId: 4
      })

      newArt.setCategory(foundCat, {save: false});
      newArt.save().then(() => cb('success'))

    })
  },

}
