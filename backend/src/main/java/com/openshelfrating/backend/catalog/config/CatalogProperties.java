package com.openshelfrating.backend.catalog.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.catalog")
public class CatalogProperties {

    private int searchMaxPageSize = 100;
    private boolean isbnValidationStrict = true;

    public int getSearchMaxPageSize() {
        return searchMaxPageSize;
    }

    public void setSearchMaxPageSize(int searchMaxPageSize) {
        this.searchMaxPageSize = searchMaxPageSize;
    }

    public boolean isIsbnValidationStrict() {
        return isbnValidationStrict;
    }

    public void setIsbnValidationStrict(boolean isbnValidationStrict) {
        this.isbnValidationStrict = isbnValidationStrict;
    }
}
