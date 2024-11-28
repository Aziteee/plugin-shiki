package run.halo.shiki;

import java.util.Properties;

import org.springframework.stereotype.Component;
import org.springframework.util.PropertyPlaceholderHelper;
import org.thymeleaf.context.ITemplateContext;
import org.thymeleaf.model.IModel;
import org.thymeleaf.model.IModelFactory;
import org.thymeleaf.processor.element.IElementModelStructureHandler;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.PluginContext;
import run.halo.app.plugin.ReactiveSettingFetcher;
import run.halo.app.theme.dialect.TemplateHeadProcessor;

/**
 * @author ryanwang
 */
@Component
@RequiredArgsConstructor
public class ShikiHeadProcessor implements TemplateHeadProcessor {

    static final PropertyPlaceholderHelper PROPERTY_PLACEHOLDER_HELPER = new PropertyPlaceholderHelper("${", "}");

    private final PluginContext pluginContext;

    private final ReactiveSettingFetcher settingFetcher;

    @Override
    public Mono<Void> process(ITemplateContext context, IModel model, IElementModelStructureHandler structureHandler) {
        return settingFetcher.fetch(CustomSetting.GROUP, CustomSetting.class)
                .doOnNext(customSetting -> {
                    final IModelFactory modelFactory = context.getModelFactory();
                    model.add(
                            modelFactory.createText(
                                    commentWidgetScript(customSetting.themeLight(), customSetting.themeDark(),
                                            customSetting.useBuiltinStyle(), customSetting.duration(),
                                            customSetting.stagger())));
                })
                .then();
    }

    private String commentWidgetScript(String themeLight, String themeDark, boolean useBuiltinStyle, int duration,
            int stagger) {

        final Properties properties = new Properties();
        final String version = pluginContext.getVersion();
        properties.setProperty("version", version);
        properties.setProperty("themeLight", themeLight);
        properties.setProperty("themeDark", themeDark);
        properties.setProperty("builtinStyle",
                useBuiltinStyle
                        ? "<link rel=\"stylesheet\" href=\"/plugins/shiki/assets/static/style.css?version=" + version
                                + "\" />"
                        : "");
        properties.setProperty("duration", String.valueOf(duration));
        properties.setProperty("stagger", String.valueOf(stagger));

        return PROPERTY_PLACEHOLDER_HELPER.replacePlaceholders("""
                <!-- plugin-shiki start -->
                ${builtinStyle}
                <script src="/plugins/shiki/assets/static/main.js?version=${version}" defer></script>
                <script>
                    window.shikiConfig = {
                        themeLight: "${themeLight}",
                        themeDark: "${themeDark}",
                        duration: ${duration},
                        stagger: ${stagger}
                    };
                </script>
                <!-- plugin-shiki end -->
                """, properties);
    }

    public record CustomSetting(String themeLight, String themeDark, boolean useBuiltinStyle, int duration,
            int stagger) {
        public static final String GROUP = "config";
    }
}