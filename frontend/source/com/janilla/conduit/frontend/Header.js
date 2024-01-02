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
class Header {

	conduit;

	get navItems() {
		const h = {
			hash: '#/',
			text: 'Home'
		};
		if (this.conduit.user)
			return [
				h, {
					hash: '#/editor',
					text: '<i class="ion-compose"></i>&nbsp;New Article'
				}, {
					hash: '#/settings',
					text: '<i class="ion-gear-a"></i>&nbsp;Settings'
				}, {
					hash: `#/@${this.conduit.user.username}`,
					text: `<img src="${this.conduit.user.image}" class="user-pic" /> ${this.conduit.user.username}`
				}];
		else
			return [
				h, {
					hash: '#/login',
					text: 'Sign in'
				}, {
					hash: '#/register',
					text: 'Sign up'
				}];
	}

	render = async key => {
		const r = this.conduit.rendering;
		const t = this.conduit.templates;

		if (key === undefined)
			return await r.render(this, t['Header']);

		if (r.stack.at(-2).key === 'navItems') {
			let i = r.object[key];
			if (i.hash === location.hash)
				i.active = 'active';
			return await r.render(i, t['Header-navitem']);
		}
	}
}

export default Header;
