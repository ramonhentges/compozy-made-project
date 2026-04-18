import { AggregateRoot } from '../../../../shared/types/aggregate_root';
import { Email } from '../value_objects/email';
import { Password } from '../value_objects/password';
import { UserId } from '../value_objects/user_id';
import { UserRegisteredEvent } from '../events/user_registered';
import { PasswordChangedEvent } from '../events/password_changed';

export class User extends AggregateRoot<UserId> {
  private constructor(
    id: UserId,
    private readonly _email: Email,
    private _password: Password,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {
    super(id);
  }

  static create(id: UserId, email: Email, passwordHash: string): User {
    const password = Password.create(passwordHash);
    const user = new User(id, email, password, new Date(), new Date());
    user.addDomainEvent(new UserRegisteredEvent(user.id, user._email));
    return user;
  }

  get email(): Email {
    return this._email;
  }

  get password(): Password {
    return this._password;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  changePassword(newHash: string): void {
    this._password = Password.create(newHash);
    this._updatedAt = new Date();
    this.addDomainEvent(new PasswordChangedEvent(this.id, this._email));
  }
}
