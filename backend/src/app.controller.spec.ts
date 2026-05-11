import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let appService: { getHello: jest.Mock };

  beforeEach(async () => {
    appService = {
      getHello: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns the greeting from the app service', () => {
    appService.getHello.mockReturnValue('Hello World! from Backend');

    expect(controller.getHello()).toBe('Hello World! from Backend');
    expect(appService.getHello).toHaveBeenCalledTimes(1);
  });
});
