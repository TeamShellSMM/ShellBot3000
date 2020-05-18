/**
 * Class representing a user error. To be thrown and caught and sent to the user with ts.getUserErrorMsg() for discord
 * @extends Error
 */
class UserError extends Error {
  constructor(message) {
    super(message);
    this.type = 'user';
    this.msg = message;
    this.name = 'UserError'; // (2)
  }
}
module.exports = UserError;
