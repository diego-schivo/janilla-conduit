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
class FollowButton {

	selector;

	user;

	engine;

	get className() {
		return this.user.following ? 'btn-secondary' : 'btn-outline-secondary';
	}

	get content() {
		return `${this.user.following ? 'Unfollow' : 'Follow'} ${this.user.username}`;
	}

	render = async e => {
		return await e.match([this], (i, o) => {
			this.engine = e.clone();
			o.template = 'FollowButton';
		});
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
		const s = await fetch(`${a.url}/profiles/${this.user.username}/follow`, {
			method: this.user.following ? 'DELETE' : 'POST',
			headers: a.headers
		});
		if (s.ok) {
			const u = (await s.json()).profile;
			this.user.following = u.following;

			this.selector().outerHTML = await this.engine.render();
			this.listen();

			this.selector().dispatchEvent(new CustomEvent('followtoggle', { bubbles: true }));
		}
	}
}

export default FollowButton;
