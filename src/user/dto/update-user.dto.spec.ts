import { validate } from 'class-validator';
import { UpdateUserDto } from './update-user.dto';

const validateDto = async (payload: Partial<UpdateUserDto>) => {
  const dto = Object.assign(new UpdateUserDto(), payload);
  return validate(dto);
};

describe('UpdateUserDto', () => {
  it('should pass validation for correct payload', async () => {
    const errors = await validateDto({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'Pass1234',
      address: 'Main street 1',
      age: 30,
    });

    expect(errors).toHaveLength(0);
  });

  it('should fail when required fields are missing', async () => {
    const errors = await validateDto({});

    const properties = errors.map((error) => error.property);

    expect(properties).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  it('should fail when age is negative', async () => {
    const errors = await validateDto({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'Pass1234',
      age: -1,
    });

    const ageError = errors.find((error) => error.property === 'age');

    expect(ageError).toBeDefined();
    expect(ageError?.constraints).toHaveProperty('isPositive');
  });

  it('should fail when age is not an integer', async () => {
    const errors = await validateDto({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'Pass1234',
      age: 20.7,
    });

    const ageError = errors.find((error) => error.property === 'age');

    expect(ageError).toBeDefined();
    expect(ageError?.constraints).toHaveProperty('isInt');
  });

  it('should pass when optional fields are omitted', async () => {
    const errors = await validateDto({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'Pass1234',
    });

    expect(errors).toHaveLength(0);
  });
});
