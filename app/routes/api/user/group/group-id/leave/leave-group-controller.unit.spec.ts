describe('LeaveGroupController', function() {
  afterEach(function() {
    sinon.restore();
  });

  it('throws BadRequestError if groupId is not parsable');

  it('throws BadRequestError if user in request is not defined');

  describe('calls leave group and', function() {
    it('responses with 204 if one membership was deleted');

    it('throws NotMemberOfGroup if no membership was deleted');

    it('throws InternalError if any other amount of membership was deleted');
  });
});
