import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './exception.filter';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let status: jest.Mock;
  let json: jest.Mock;
  let getRequest: jest.Mock;
  let getResponse: jest.Mock;
  let switchToHttp: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();

    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    getRequest = jest.fn().mockReturnValue({
      url: '/users',
      method: 'POST',
    });
    getResponse = jest.fn().mockReturnValue({ status });
    switchToHttp = jest.fn().mockReturnValue({
      getRequest,
      getResponse,
    });

    host = {
      switchToHttp,
    } as unknown as ArgumentsHost;
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('returns the http exception status and message', () => {
    const errorSpy = jest.spyOn((filter as any).logger, 'error');
    const exception = new BadRequestException('Validation failed');

    filter.catch(exception, host);

    expect(switchToHttp).toHaveBeenCalledTimes(1);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Validation failed',
    });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Path: /users'),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Method: POST'),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Status: 400'),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Message: Validation failed'),
    );
  });

  it('handles string http exception responses', () => {
    const errorSpy = jest.spyOn((filter as any).logger, 'error');
    const exception = new HttpException('Forbidden', 403);

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({
      statusCode: 403,
      message: 'Forbidden',
    });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Message: Forbidden'),
    );
  });

  it('falls back to a 500 response for non-http errors', () => {
    const errorSpy = jest.spyOn((filter as any).logger, 'error');
    const exception = new Error('Unexpected failure');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Unexpected failure',
    });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Status: 500'),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Message: Unexpected failure'),
    );
  });
});
