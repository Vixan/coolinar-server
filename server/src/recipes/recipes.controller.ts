import {
  Controller,
  Get,
  UseGuards,
  Post,
  Body,
  UsePipes,
  UseInterceptors,
} from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { AuthGuard } from '@nestjs/passport';
import { Recipe } from './recipes.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { ValidationPipe } from '../shared/pipes/validation.pipe';
import { RecipeValidationInterceptor } from './interceptors/recipe-validation.interceptor';
import { TransformInterceptor } from '../shared/interceptors/transform.interceptor';
import { RecipeDto } from './dto/recipe.dto';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(new TransformInterceptor(RecipeDto))
  async getAll(): Promise<RecipeDto[]> {
    return this.recipesService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe())
  @UseInterceptors(RecipeValidationInterceptor)
  async add(@Body() createRecipeDto: CreateRecipeDto): Promise<any> {
    const recipe = new Recipe({ ...createRecipeDto });

    return this.recipesService.add(recipe);
  }
}
