import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiError } from '../utils/ApiError';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response) => {
    const data = await this.authService.register(req.body);
    res.status(201).json({
      success: true,
      data,
    });
  };

  login = async (req: Request, res: Response) => {
    const data = await this.authService.login(req.body);

    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: data.accessToken,
        user: data.user
      },
    });
  };

  logout = async (req: Request, res: Response) => {
    res.clearCookie('refreshToken');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  };

  getMe = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const data = await this.authService.getMe(userId);
    res.status(200).json({
      success: true,
      data,
    });
  };

  refreshToken = async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken;
    if (!token) {
      throw new ApiError(401, 'No refresh token provided');
    }

    const data = await this.authService.refreshToken(token);

    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: data.accessToken
      },
    });
  };
}
