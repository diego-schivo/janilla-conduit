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
class CommentCard {

	selector;

	engine;

	article;

	comment;

	render = async engine => {
		if (engine.isRendering(this)) {
			this.engine = engine.clone();
			return await engine.render(this, 'CommentCard');
		}

		if (engine.isRendering(this, 'modOptions'))
			return engine.app.currentUser?.username === this.comment.author.username ? await engine.render(this, 'CommentCard-modOptions') : '';
	}

	listen = () => {
		this.selector().querySelector('.ion-trash-a')?.addEventListener('click', this.handleDeleteClick);
	}

	handleDeleteClick = async e => {
		e.preventDefault();
		const a = this.engine.app.api;
		const s = await fetch(`${a.url}/articles/${this.article.slug}/comments/${this.comment.id}`, {
			method: 'DELETE',
			headers: a.headers
		});
		if (s.ok) {
			const c = this.selector();
			c.dispatchEvent(new CustomEvent('commentremove', {
				bubbles: true,
				detail: { comment: this.comment }
			}));
			c.remove();
		}
	}
}

export default CommentCard;
