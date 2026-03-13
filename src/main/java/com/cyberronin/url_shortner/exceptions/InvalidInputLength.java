package com.cyberronin.url_shortner.exceptions;

public class InvalidInputLength extends RuntimeException {
    private final int providedSize;
    private final int maxSize;
    private final int minSize;

    public InvalidInputLength(int providedSize, int maxSize, int minSize) {
        super(String.format("Input size [%d] is out of range of [%d - %d]", providedSize, minSize, maxSize));
        this.providedSize = providedSize;
        this.maxSize = maxSize;
        this.minSize = minSize;
    }

    public int getProvidedSize() { return providedSize; }
    public int getMaxSize() { return maxSize; }
    public int getMinSize() {
        return minSize;
    }
}