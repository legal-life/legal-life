# legal&lifeの README

## 私たちについて
私たちは、学校の授業の一環でコードによるサイト作成をしているものです。  
まだ未熟なコーディネータなので、暫定コードが入っているかと思われます。  
その点を皆様にご指摘していただきたいと考えております。ご協力をよろしくお願いいたします。

## 私たちが作成しているサイトについて
lrgal&lifeというサイトを作成しています。  
このサイトには法令の学習機能・相談機能・検索機能を導入したいと思います。  
このサイトによって法令に関して困る人を無くすことを目指しております。
詳細は<a href="https://legal-life.pages.dev/info/about" target="_blank" rel="noopener, noreferrer">サイト概要ページ</a>にも掲載しております。

## サイトのデモ利用について
動作確認をする際は、<a href="https://legal-life.pages.dev/" target="_blank" rel="noopener, noreferrer">こちら</a>のページで動作確認が可能になっております。

## それぞれの機能について
- 学習機能
>[!NOTE]
>法令をわかりやすく学習できるページを作成します。

>[!CAUTION]
>とにかくすべての法令を追加したいがコンテンツ作成に様々な課題がある。  
>リリースが実現できない可能性

- <a href="https://legal-life.pages.dev/content/caht" target="_blank" rel="noopener, noreferrer">チャット機能</a>
> [!NOTE]
>今現在はGemini-3.5-flashを利用して法令のチャットができるようにしております。

> [!CAUTION]
>サイト利用者が増加し大量のリクエストが発生した際には課金しないといけない。

- <a href="https://legal-life.pages.dev/content/search" target="_blank" rel="noopener, noreferrer">検索機能</a>
> [!NOTE]
> e-gov法令APIを利用して法令を検索できるようにしています。

> [!CAUTION]
>大量にリクエストが発生しても大丈夫なのか。

- <a href="https://legal-life.pages.dev/content/news" target="_blank" rel="noopener, noreferrer">ニュース機能</a>
> [!NOTE]
>法令関連のニュースを掲載します。  
>ニュースの下部には該当する学習機能のページへの推移を促進

> [!CAUTION]
> ニュースを個人的に読み解くのが非常に難しい

その他お知らせは、<a href="https://legal-life.pages.dev/info" target="_blank" rel="noopener, noreferrer">お知らせページ</a>をご確認ください。

## 既知の問題
- フォント  
apple系列のOSを利用中の場合、フォントが正常に読み込まれない問題  
>改善策として、フォントファイルをサイトデータに追加し、読み込む方式を採択。環境がないため表示を確認することが不可能。

- Webアクセシビリティ  
ハンガーメニュー表示時並びに、アカウントログイン画面表示時に後ろ側もTabキーが反応してしまう問題  
それ以外のページにおいてもボタンに2回もTabキーが反応してしまう問題
>改善するために、様々なページにて検証を重ねております。
