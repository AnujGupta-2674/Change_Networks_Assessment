import { UserRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/ApiError';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(data: any) {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    const passwordHash = await hashPassword(data.password);
    
    const user = await this.userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
      isRoot: data.isRoot === true,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isRoot: user.isRoot,
    };
  }

  async login(data: any) {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      isRoot: user.isRoot,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: payload,
    };
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isRoot: user.isRoot,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await this.userRepository.findById(decoded.id);
      if (!user) {
        throw new ApiError(401, 'User associated with refresh token no longer exists');
      }

      const payload = {
        id: user.id,
        email: user.email,
        isRoot: user.isRoot,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(401, 'Invalid or expired refresh token');
    }
  }
}
