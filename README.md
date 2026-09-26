# Chirpy Starter

[![Gem Version](https://img.shields.io/gem/v/jekyll-theme-chirpy)][gem]&nbsp;
[![GitHub license](https://img.shields.io/github/license/cotes2020/chirpy-starter.svg?color=blue)][mit]

When installing the [**Chirpy**][chirpy] theme through [RubyGems.org][gem], Jekyll can only read files in the folders
`_data`, `_layouts`, `_includes`, `_sass` and `assets`, as well as a small part of options of the `_config.yml` file
from the theme's gem. If you have ever installed this theme gem, you can use the command
`bundle info --path jekyll-theme-chirpy` to locate these files.

The Jekyll team claims that this is to leave the ball in the user’s court, but this also results in users not being
able to enjoy the out-of-the-box experience when using feature-rich themes.

To fully use all the features of **Chirpy**, you need to copy the other critical files from the theme's gem to your
Jekyll site. The following is a list of targets:

```shell
.
├── _config.yml
├── _plugins
├── _tabs
└── index.html
```

To save you time, and also in case you lose some files while copying, we extract those files/configurations of the
latest version of the **Chirpy** theme and the [CD][CD] workflow to here, so that you can start writing in minutes.

## Usage

Check out the [theme's docs](https://github.com/cotes2020/jekyll-theme-chirpy/wiki).

## 首页内容配置

首页会读取文章 front matter 中的 `categories`，每个分类自动形成一行倾斜排列的立体档案；新增分类不需要修改首页布局。INFO 另占一行。

文章封面默认沿用 Chirpy 的 `image.path`：

```yaml
categories:
  - 说学逗唱
image:
  path: /assets/img/posts/example/cover.webp
  alt: 封面说明
```

如果文章页与首页想使用不同图片，可以额外设置 `home_cover`：

```yaml
home_cover: /assets/img/posts/example/home-cover.webp
```

首页的方块统一为白色，INFO 行为灰色。悬停或键盘聚焦方块后，旁边显示标题、日期、简介和彩色封面；未配置封面的文章只显示文字信息。

每行下方的立体滑动条在悬停时出现，可以拖动浏览超出显示范围的文章，也支持聚焦后按方向键、Home / End，以及横向触控板滚动或 Shift + 滚轮。所有方块已显示时，滑动条铺满且不可拖动。手机上滑动条常显，横向滑动也可浏览；轻触方块预览，再次轻触或点击预览标题进入文章。

首页结构位于 `_layouts/archive-home.html`，方块与滑动条模板在 `_includes/archive-block.html` 和 `_includes/archive-scrollbar.html`。样式位于 `assets/css/archive-home.css`，交互位于 `assets/js/archive-home.js`。`--angle-x`、`--angle-z` 控制整个排列平面的倾斜角度，`--depth` 控制厚度，`--card-gap` 和 `--row-gap` 控制块间及行间距离。

## Contributing

This repository is automatically updated with new releases from the theme repository. If you encounter any issues or want to contribute to its improvement, please visit the [theme repository][chirpy] to provide feedback.

## License

This work is published under [MIT][mit] License.

[gem]: https://rubygems.org/gems/jekyll-theme-chirpy
[chirpy]: https://github.com/cotes2020/jekyll-theme-chirpy/
[CD]: https://en.wikipedia.org/wiki/Continuous_deployment
[mit]: https://github.com/cotes2020/chirpy-starter/blob/master/LICENSE
