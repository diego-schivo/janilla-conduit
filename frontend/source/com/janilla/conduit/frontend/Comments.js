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
import CommentCard from './CommentCard.js';
import CommentForm from './CommentForm.js';

class Comments {

	selector;

	article;

	conduit;

	rendering;

	form;

	cards;

	render = async (key, rendering) => {
		switch (key) {
			case undefined:
				this.conduit = rendering.stack[0].object;
				this.rendering = rendering.clone();
				return await rendering.render(this, 'Comments');

			case 'form':
				this.form = new CommentForm();
				this.form.article = this.article;
				this.form.selector = () => this.selector().firstElementChild.firstElementChild;
				return this.form;

			case 'cards':
				const s = await fetch(`${this.conduit.backendUrl}/api/articles/${this.article.slug}/comments`, {
					headers: this.conduit.backendHeaders
				});
				this.cards = s.ok ? (await s.json()).comments.map((c, i) => {
					const d = new CommentCard();
					d.article = this.article;
					d.comment = c;
					d.selector = () => this.selector().firstElementChild.children[1 + i];
					return d;
				}) : null;
				return this.cards;
		}
	}

	listen = () => {
		const e = this.selector();
		e.addEventListener('commentadd', this.handleCommentAdd);
		e.addEventListener('commentremove', this.handleCommentRemove);
		this.form.listen();
		this.cards.forEach(c => c.listen());
	}

	handleCommentAdd = async e => {
		const c = new CommentCard();
		c.conduit = this.conduit;
		c.article = this.article;
		c.comment = e.detail.comment;
		c.selector = () => this.selector().firstElementChild.children[1];
		this.cards.unshift(c);

		const h = await this.rendering.render(c);
		this.form.selector().insertAdjacentHTML('afterend', h);
		c.listen();
	}

	handleCommentRemove = e => {
		const i = this.cards.findIndex(c => c.comment.id === e.detail.comment.id);
		this.cards.splice(i, 1);
	}
}

export default Comments;
