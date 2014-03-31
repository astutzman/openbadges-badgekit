var getDb = require('../lib/db').getDb;
var async = require('async');

module.exports = function getAccountModel (key) {
  var db = getDb(key);

  var AccountPermission = db.table('accountPermission', {
    fields:
      ['id',
       'accountId',
       'system',
       'issuer',
       'program',
       'canDraft',
       'canPublish',
       'canReview'],
    relationships: {
      account: {
        type: 'hasOne',
        local: 'accountId',
        foreign: { table: 'account', key: 'id' }
      }
    }
  });

  var Account = db.table('account', {
    fields: 
      ['id',
       'email'],
    relationships: {
      accountPermissions: {
        type: 'hasMany',
        local: 'id',
        foreign: { table: 'accountPermission', key: 'accountId' }
      }
    },
    methods: {
      hasPermission: hasPermission
    }
  });


  function hasPermission(context, action) {
    if (action == 'view') {
      if (this.accountPermissions) {
        var canView = false;
        this.accountPermissions.forEach(function(permission) {
          if ((context.system === permission.system) &&
              (!context.issuer || !permission.issuer || (context.issuer === permission.issuer)) &&
              (!context.program || !permission.program || (context.program === permission.program))) {
            canView = true;
          }
        });
        return canView;
      }
    }
    else {
      var bestMatch = null;

      if (this.accountPermissions) {
        this.accountPermissions.forEach(function(permission) {
          if ((!permission.system || (context.system === permission.system)) &&
              (!permission.issuer || (context.issuer === permission.issuer)) &&
              (!permission.program || (context.program === permission.program))) {
            if ((!bestMatch) ||
                (permission.program) ||
                (permission.issuer && !bestMatch.issuer) ||
                (permission.system && !bestMatch.system)) {
              console.log(permission);
              bestMatch = permission;
            }
          }
        });
      }

      if (bestMatch) {
        switch (action) {
          case 'draft':
            return bestMatch.canDraft;
          case 'publish':
            return bestMatch.canPublish;
          case 'review':
            return bestMatch.canReview;
          case 'admin':
            return bestMatch.canPublish;
          default:
            return false;
        }
      }
    }

    return false;
  }

  return Account;
};

