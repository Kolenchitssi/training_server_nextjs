import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

const validateDto = async (payload: Partial<LoginDto>) => {
  const dto = Object.assign(new LoginDto(), payload);
  return validate(dto);
};

describe('LoginDto', () => {
  it('should pass validation for correct payload', async () => {
    const errors = await validateDto({
      email: 'user@example.com',
      password: 'Pass1234',
    });

    expect(errors).toHaveLength(0);
  });

  it('should fail when email is invalid', async () => {
    const errors = await validateDto({
      email: 'invalid-email',
      password: 'Pass1234',
    });

    const emailError = errors.find((error) => error.property === 'email');

    expect(emailError).toBeDefined();
    expect(Object.values(emailError?.constraints ?? {})).toContain('Email must be valid');
  });

  it('should fail when email is empty', async () => {
    const errors = await validateDto({
      email: '',
      password: 'Pass1234',
    });

    const emailError = errors.find((error) => error.property === 'email');

    expect(emailError).toBeDefined();
    expect(Object.values(emailError?.constraints ?? {})).toContain('Email is required');
  });

  it('should fail when password is shorter than 6 symbols', async () => {
    const errors = await validateDto({
      email: 'user@example.com',
      password: 'Pas1',
    });

    const passwordError = errors.find((error) => error.property === 'password');

    expect(passwordError).toBeDefined();
    expect(Object.values(passwordError?.constraints ?? {})).toContain(
      'Password must be at least 6 characters long',
    );
  });

  it('should fail when password is empty', async () => {
    const errors = await validateDto({
      email: 'user@example.com',
      password: '',
    });

    const passwordError = errors.find((error) => error.property === 'password');

    expect(passwordError).toBeDefined();
    expect(Object.values(passwordError?.constraints ?? {})).toContain(
      'Password is required',
    );
  });
});
