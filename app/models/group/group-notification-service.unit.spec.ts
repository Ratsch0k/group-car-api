/* eslint-disable @typescript-eslint/no-explicit-any */
import sinon, {assert, match} from 'sinon';
import {CarColor} from '../car';
import GroupNotificationService, {
  GroupCarAction,
} from './group-notification-service';

describe('GroupNotificationService', function() {
  afterEach(function() {
    sinon.restore();
  });

  describe('notifyCarUpdate', function() {
    const nsp = {
      emit: sinon.stub(),
      use: sinon.stub(),
      on: sinon.stub(),
    };
    const io = {
      of: sinon.stub().returns(nsp),
    };

    GroupNotificationService.setIo(io as any);

    const groupId = 88;
    const carId = 4;
    const type = GroupCarAction.Drive;
    const car = {
      name: 'test',
      groupId,
      carId,
      color: CarColor.Blue,
    };
    GroupNotificationService.notifyCarUpdate(
        groupId,
        carId,
        type,
      car as any,
    );

    assert.calledWithExactly(io.of, /^\/group\/\w+/);
    assert.calledWithExactly(io.of, `/group/${groupId}`);
    assert.calledTwice(io.of);
    assert.calledOnceWithExactly(
        nsp.emit,
        'update',
        match({action: type, car}),
    );
  });
});
