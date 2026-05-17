from playwright.sync_api import sync_playwright
import os

# 使用 file:// URL 来打开本地 HTML 文件
html_path = os.path.abspath('d:\\Software\\TRAE_CN\\projects\\xuanhuan-pixel\\index.html')
file_url = f'file:///{html_path.replace(chr(92), "/")}'

print(f'Testing URL: {file_url}')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # 捕获控制台日志
    console_messages = []
    page.on('console', lambda msg: console_messages.append(f'[{msg.type}] {msg.text}'))

    # 导航到页面
    page.goto(file_url)
    page.wait_for_load_state('networkidle')

    # 截图查看页面状态
    page.screenshot(path='d:/temp/page_initial.png', full_page=True)
    print('Initial page screenshot saved')

    # 查看页面标题
    print(f'Page title: {page.title()}')

    # 查找生成按钮
    generate_btn = page.locator('#generateBtn')
    print(f'Generate button found: {generate_btn.count() > 0}')
    if generate_btn.count() > 0:
        print(f'Generate button text: {generate_btn.inner_text()}')
        print(f'Generate button disabled: {generate_btn.is_disabled()}')

    # 查找上传区域
    upload_area = page.locator('#uploadArea')
    print(f'Upload area found: {upload_area.count() > 0}')

    # 查找图片输入
    image_input = page.locator('#imageInput')
    print(f'Image input found: {image_input.count() > 0}')

    # 查看控制台消息
    print('\nConsole messages:')
    for msg in console_messages:
        print(msg)

    # 滚动到生成器部分
    page.evaluate('document.querySelector("#generator").scrollIntoView()')
    page.wait_for_timeout(500)
    page.screenshot(path='d:/temp/page_generator.png', full_page=True)
    print('Generator section screenshot saved')

    # 检查 PixelArtGenerator 是否已初始化
    initialized = page.evaluate('typeof PixelArtGenerator !== "undefined"')
    print(f'\nPixelArtGenerator class exists: {initialized}')

    # 检查实例是否已创建
    instance_exists = page.evaluate('typeof window.generator !== "undefined" || document.querySelector("#generateBtn") !== null')
    print(f'Generator instance or element exists: {instance_exists}')

    browser.close()

    print('\nTest completed!')
