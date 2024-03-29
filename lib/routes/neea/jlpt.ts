import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/jlpt',
    categories: ['study'],
    example: '/neea/jlpt',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['jlpt.neea.cn/'],
        },
    ],
    name: '教育部考试中心日本语能力测试重要通知',
    maintainers: ['nczitzk'],
    handler,
    url: 'jlpt.neea.cn/',
};

async function handler() {
    const rootUrl = 'https://news.neea.cn';
    const currentUrl = `${rootUrl}/JLPT/1/newslist.htm`;

    const response = await got({
        method: 'get',
        url: currentUrl,
    });

    const $ = load(response.data);

    let items = $('a')
        .toArray()
        .map((item) => {
            item = $(item);

            const matches = item.text().match(/(\d{4}-\d{2}-\d{2})/);

            return {
                title: item.text(),
                link: `${rootUrl}/JLPT/1/${item.attr('href')}`,
                pubDate: matches ? parseDate(matches[1]) : '',
            };
        });

    items = await Promise.all(
        items.map((item) =>
            cache.tryGet(item.link, async () => {
                const detailResponse = await got({
                    method: 'get',
                    url: item.link,
                });

                const content = load(detailResponse.data);

                item.description = content('.dvContent').html();

                return item;
            })
        )
    );

    return {
        title: '重要通知 - 教育部考试中心日本语能力测试',
        link: currentUrl,
        item: items,
    };
}
