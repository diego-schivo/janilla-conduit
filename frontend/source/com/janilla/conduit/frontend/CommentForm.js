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
import Errors from './Errors.js';

class CommentForm {

	selector;

	article;

	engine;

	errors;

	render = async engine => {
		if (engine.isRendering(this)) {
			this.engine = engine.clone();
			return await engine.render(this, `CommentForm-${this.engine.app.currentUser ? 'authenticated' : 'unauthenticated'}`);
		}

		if (engine.isRendering(this, 'errors')) {
			this.errors = new Errors();
			this.errors.selector = () => this.selector().firstElementChild;
			return this.errors;
		}
	}

	listen = () => {
		this.selector().querySelector('.comment-form')?.addEventListener('submit', this.handleSubmit);
	}

	handleSubmit = async e => {
		e.preventDefault();
		const a = this.engine.app.api;
		const f = e.currentTarget;
		const s = await fetch(`${a.url}/articles/${this.article.slug}/comments`, {
			method: 'POST',
			headers: { ...a.headers, 'Content-Type': 'application/json' },
			body: JSON.stringify({ comment: Object.fromEntries(new FormData(f)) })
		});
		const j = await s.json();
		this.errors.messages = s.ok ? null : j;
		await this.errors.refresh();
		if (s.ok) {
			f.elements['body'].value = '';
			this.selector().dispatchEvent(new CustomEvent('commentadd', {
				bubbles: true,
				detail: { comment: j.comment }
			}));
		}
	}
}

export default CommentForm;
