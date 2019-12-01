import {
  UseGuards,
  Post,
  Body,
  UsePipes,
  UseInterceptors,
  Put,
  Param,
  NotFoundException,
  Delete,
  ConflictException,
  ValidationPipe,
  Controller,
  UseFilters,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransformInterceptor } from 'src/shared/interceptors/transform.interceptor';
import { CreateReviewDto } from 'src/reviews/dto/create-review.dto';
import { RecipeDto } from 'src/recipes/dto/recipe.dto';
import { RecipesService } from 'src/recipes/recipes.service';
import { UsersService } from 'src/users/users.service';
import { UpdateReviewDto } from 'src/reviews/dto/update-review.dto';
import { ReviewsService } from './reviews.service';
import { HttpExceptionFilter } from 'src/shared/filters/http-exception.filter';
import { Review } from './reviews.entity';
import { Recipe } from '../recipes/recipes.entity';

/**
 * Controller that handles the reviews routes.
 *
 * @class RecipesController
 */
@Controller('reviews')
@UseFilters(HttpExceptionFilter)
export class ReviewsController {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly usersService: UsersService,
    private readonly reviewsService: ReviewsService,
  ) {}

  /**
   * Create a new recipe review.
   *
   * @param {string} slug
   * @param {CreateReviewDto} createReviewDto Review sent by the client.
   * @returns {Promise<RecipeDto>} Promise of the created recipe.
   * @memberof ReviewsController
   */
  @Post(':slug')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe())
  @UseInterceptors(new TransformInterceptor(RecipeDto))
  async create(
    @Param('slug') slug: string,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<Recipe> {
    const recipe = await this.recipesService.findBySlug(slug);

    if (!recipe) {
      throw new NotFoundException({ errors: { slug: 'Inexistent slug' } });
    }

    if (
      recipe.reviews.find(
        review => review.author.name === createReviewDto.author,
      )
    ) {
      throw new ConflictException({
        errors: { author: 'Recipe already reviewd by specified user' },
      });
    }

    const author = await this.usersService.findBySlug(createReviewDto.author);

    if (!author) {
      throw new NotFoundException({
        errors: { author: 'Inexistent review author' },
      });
    }

    return this.reviewsService.create(
      recipe,
      new Review({
        ...createReviewDto,
        author: author.slug,
      }),
    );
  }

  /**
   * Update a recipe review.
   *
   * @param {string} slug
   * @param {Partial<UpdateReviewDto>} updateReviewDto Updated review sent by the client.
   * @returns {Promise<RecipeDto>} Promise of the updated recipe.
   * @memberof ReviewsController
   */
  @Put(':slug')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe())
  @UseInterceptors(new TransformInterceptor(RecipeDto))
  async update(
    @Param('slug') slug: string,
    @Body() updateReviewDto: Partial<UpdateReviewDto>,
  ): Promise<Recipe> {
    const recipe = await this.recipesService.findBySlug(slug);

    if (!recipe) {
      throw new NotFoundException({ errors: { slug: 'Inexistent slug' } });
    }

    const reviewToUpdate = recipe.reviews.find(
      review => review.author.name === updateReviewDto.author,
    );

    if (!reviewToUpdate) {
      throw new NotFoundException({
        errors: {
          author: 'Specified user does not have a review for this recipe',
        },
      });
    }

    return this.reviewsService.update(
      recipe,
      new Review({
        ...reviewToUpdate,
        ...updateReviewDto,
      }),
    );
  }

  /**
   * Remove a recipe review.
   *
   * @param {string} slug
   * @param {string} author Recipe author.
   * @returns {Promise<RecipeDto>} Promise of the removed recipe.
   * @memberof ReviewsController
   */
  @Delete(':slug')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe())
  @UseInterceptors(new TransformInterceptor(RecipeDto))
  async delete(
    @Param('slug') slug: string,
    @Body('author') author: string,
  ): Promise<Recipe> {
    const recipe = await this.recipesService.findBySlug(slug);

    if (!recipe) {
      throw new NotFoundException({ errors: { slug: 'Inexistent slug' } });
    }

    const reviewToDelete = recipe.reviews.find(
      review => review.author.name === author,
    );

    if (!reviewToDelete) {
      throw new NotFoundException({
        errors: {
          author: 'Specified user does not have a review for this recipe',
        },
      });
    }

    return this.reviewsService.delete(recipe, reviewToDelete);
  }
}
