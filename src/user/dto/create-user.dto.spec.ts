import { validate } from 'class-validator';
import { CreateUserDto, UserTags } from './create-user.dto';

const validateDto = async (payload: Partial<CreateUserDto>) => {
  const dto = Object.assign(new CreateUserDto(), payload);
  return validate(dto);
};

describe('CreateUserDto', () => {
  it('should pass validation for correct payload', async () => {
    const errors = await validateDto({
      name: 'testJohny1',
      email: 'user01@example.com',
      password: 'Pass1234',
      address: 'Main street 1',
      age: 25,
      tags: [UserTags.ADMIN, UserTags.USER],
    });

    expect(errors).toHaveLength(0);
  });

  it('should fail when name does not start with test', async () => {
    const errors = await validateDto({
      name: 'John Smith',
      email: 'user01@example.com',
      password: 'Pass1234',
    });

    const nameError = errors.find((error) => error.property === 'name');

    expect(nameError).toBeDefined();
    expect(nameError?.constraints).toHaveProperty(
      'startWith',
      'Name must start with "test"',
    );
  });

  it('should fail when password has no digits', async () => {
    const errors = await validateDto({
      name: 'testJohny1',
      email: 'user01@example.com',
      password: 'Password',
    });

    const passwordError = errors.find((error) => error.property === 'password');

    expect(passwordError).toBeDefined();
    expect(passwordError?.constraints).toHaveProperty(
      'matches',
      'Password must contain at least one letter and one number',
    );
  });

  it('should fail when age is not an integer', async () => {
    const errors = await validateDto({
      name: 'testJohny1',
      email: 'user01@example.com',
      password: 'Pass1234',
      age: 25.5,
    });

    const ageError = errors.find((error) => error.property === 'age');

    expect(ageError).toBeDefined();
    expect(ageError?.constraints).toHaveProperty('isInt', 'Age must be a int number');
  });

  it('should fail when tags contain invalid enum values', async () => {
    const errors = await validateDto({
      name: 'testJohny1',
      email: 'user01@example.com',
      password: 'Pass1234',
      tags: ['moderator'],
    });

    const tagsError = errors.find((error) => error.property === 'tags');

    expect(tagsError).toBeDefined();
    expect(tagsError?.constraints).toHaveProperty(
      'isEnum',
      'Each tag must be a valid enum value',
    );
  });

  it('should pass when optional fields are omitted', async () => {
    const errors = await validateDto({
      name: 'testJohny1',
      email: 'user01@example.com',
      password: 'Pass1234',
    });

    expect(errors).toHaveLength(0);
  });
});
