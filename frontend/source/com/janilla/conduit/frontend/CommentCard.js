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
	
	article;
	
	comment;

	conduit;

	get modOptionsClass() {
		return this.conduit.user?.username === this.comment.author.username ? null : 'hidden';
	}

	render = async key => {
		const r = this.conduit.rendering;
		const t = this.conduit.templates;

		if (key === undefined)
			return await r.render(this, t['CommentCard']);

		if (typeof key === 'string' && Object.hasOwn(this.comment, key)) {
			let v = this.comment[key];
			/*
			if (key === 'createdAt')
				v = new Date(v).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				});
			*/
			return v;
		}
	}

	listen = () => {
		document.querySelector(`#comment-${this.comment.id} .ion-trash-a`).addEventListener('click', this.handleTrashClick);
	}

	handleTrashClick = async e => {
		const c = e.target.closest('.card');
		if (!c)
			return;
		e.preventDefault();
		const s = await fetch(`${this.conduit.backendUrl}/api/articles/${this.article.slug}/comments/${this.comment.id}`, {
			method: 'DELETE',
			headers: this.conduit.backendHeaders
		});
		if (s.ok) {
			c.dispatchEvent(new CustomEvent('commentremove', {
				bubbles: true,
				detail: { comment: this.comment }
			}));
			c.remove();
		}
	}
}

export default CommentCard;
