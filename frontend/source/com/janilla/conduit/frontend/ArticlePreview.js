/*
 * MIT License
 *
 * Copyright (c) 2024 Diego Schivo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import ArticleMeta from './ArticleMeta.js';
import FavoriteButton from './FavoriteButton.js';

class ArticlePreview {

	selector;

	article;

	meta;

	favoriteButton;

	render = async engine => {
		if (engine.isRendering(this))
			return await engine.render(this, 'ArticlePreview');

		switch (engine.key) {
			case 'meta':
				this.meta = new ArticleMeta();
				this.meta.selector = () => this.selector().firstElementChild;
				return this.meta;

			case 'content':
				switch (engine.target) {
					case this.meta:
						this.favoriteButton = new FavoriteButton();
						this.favoriteButton.article = this.article;
						this.meta.content = this.favoriteButton;
						return this.favoriteButton;

					case this.favoriteButton:
						return this.article.favoritesCount;
				}
				break;

			case 'className':
				if (engine.target === this.favoriteButton)
					return `${this.article.favorited ? 'btn-primary' : 'btn-outline-primary'} pull-xs-right`;
				break;
		}

		if (engine.isRenderingArrayItem('tagList'))
			return await engine.render(engine.target, 'ArticlePreview-tag');
	}

	listen = () => {
		this.meta?.listen();
	}
}

export default ArticlePreview;
