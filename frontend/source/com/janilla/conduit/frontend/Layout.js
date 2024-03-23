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
class Layout {

	selector;

	engine;

	header;

	footer;

	get page() {
		return this.engine.app.currentPage;
	}

	render = async e => {
		return await e.match([this], (i, o) => {
			this.engine = e.clone();
			o.template = 'Layout';
		}) || await e.match([this, 'header'], (i, o) => {
			this.header = new Header();
			o.value = this.header;
		}) || await e.match([this, 'footer'], (i, o) => {
			this.footer = new Footer();
			o.value = this.footer;
		});
	}

	listen = () => {
		this.page.listen();
	}
}

class Header {

	engine;

	get navItems() {
		const h = {
			hash: '#/',
			text: 'Home'
		};
		const u = this.engine.app.currentUser;
		if (u)
			return [
				h, {
					hash: '#/editor',
					text: '<i class="ion-compose"></i>&nbsp;New Article'
				}, {
					hash: '#/settings',
					text: '<i class="ion-gear-a"></i>&nbsp;Settings'
				}, {
					hash: `#/@${u.username}`,
					text: `<img src="${u.image}" class="user-pic" /> ${u.username}`
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

	/*
	render = async e => {
		if (engine.isRendering(this)) {
			this.engine = e.clone();
			return await engine.render(this, 'Header');
		}

		if (engine.isRendering(this, 'navItems', true)) {
			const i = engine.target;
			if (i.hash === location.hash)
				i.active = 'active';
			return await engine.render(i, 'Header-navitem');
		}
	}
	*/

	render = async e => {
		return await e.match([this], (i, o) => {
			this.engine = e.clone();
			o.template = 'Header';
		}) || await e.match([this, 'navItems', 'number'], (i, o) => {
			if (o.value.hash === location.hash)
				o.value.active = 'active';
			o.template = 'Header-navitem';
		});
	}
}

class Footer {

	/*
	render = async e => {
		if (engine.isRendering(this))
			return await engine.render(this, 'Footer');
	}
	*/

	render = async e => {
		return await e.match([this], (i, o) => {
			o.template = 'Footer';
		});
	}
}

export default Layout;
