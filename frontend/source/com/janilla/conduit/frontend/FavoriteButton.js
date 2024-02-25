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
class FavoriteButton {

	selector;

	article;

	engine;

	get className() {
		return this.article.favorited ? 'btn-primary' : 'btn-outline-primary';
	}

	get content() {
		return `${this.article.favorited ? 'Unfavorite' : 'Favorite'} Article <span class="counter">(${this.article.favoritesCount})</span>`;
	}

	render = async engine => {
		if (engine.isRendering(this)) {
			this.engine = engine.clone();
			return await engine.render(this, 'FavoriteButton');
		}
	}

	listen = () => {
		this.selector().addEventListener('click', this.handleClick);
	}

	handleClick = async e => {
		e.preventDefault();
		if (!this.engine.app.currentUser) {
			location.hash = '#/login';
			return;
		}
		const a = this.engine.app.api;
		const s = await fetch(`${a.url}/articles/${this.article.slug}/favorite`, {
			method: this.article.favorited ? 'DELETE' : 'POST',
			headers: a.headers
		});
		if (s.ok) {
			const a = (await s.json()).article;
			['favorited', 'favoritesCount'].forEach(n => this.article[n] = a[n]);

			this.selector().outerHTML = await this.render(this.engine);
			this.listen();

			this.selector().dispatchEvent(new CustomEvent('favoritetoggle', { bubbles: true }));
		}
	}
}

export default FavoriteButton;
