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

	article;

	conduit;

	render = async key => {
		switch (key) {
			case undefined:
				const r = this.conduit.rendering;
				const t = this.conduit.templates;
				return await r.render(this, t[this.conduit.user ? 'CommentForm' : 'CommentForm-login']);

			case 'errors':
				this.errors = new Errors();
				this.errors.conduit = this.conduit;
				return this.errors;
		}
	}

	listen = () => {
		document.querySelector('.comment-form')?.addEventListener('submit', this.handleFormSubmit);
	}

	handleFormSubmit = async e => {
		e.preventDefault();
		const f = e.currentTarget;
		const s = await fetch(`${this.conduit.backendUrl}/api/articles/${this.article.slug}/comments`, {
			method: 'POST',
			headers: { ...this.conduit.backendHeaders, 'Content-Type': 'application/json' },
			body: JSON.stringify({ comment: Object.fromEntries(new FormData(f)) })
		});
		const j = await s.json();
		if (s.ok) {
			f.dispatchEvent(new CustomEvent('commentadd', {
				bubbles: true,
				detail: { comment: j.comment }
			}));
			f.elements['body'].value = '';
		} else
			await this.errors.refresh(j);
	}
}

export default CommentForm;
