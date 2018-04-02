<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:android="http://schemas.android.com/apk/res/android">

  <xsl:param name="localNotify.channelName" />
  <xsl:param name="localNotify.enableLight" />
  <xsl:param name="localNotify.showBadge" />

	<!--	<xsl:strip-space elements="*" />-->
	<xsl:output indent="yes" />

	<xsl:template match="comment()" />

	<xsl:template match="meta-data[@android:name='LOCALNOTIFY_CHANNEL_NAME']">
		<meta-data android:name="LOCALNOTIFY_CHANNEL_NAME" android:value="{$localNotify.channelName}"/>
	</xsl:template>

	<xsl:template match="meta-data[@android:name='LOCALNOTIFY_ENABLE_LIGHT']">
		<meta-data android:name="LOCALNOTIFY_ENABLE_LIGHT" android:value="{$localNotify.enableLight}"/>
	</xsl:template>

	<xsl:template match="meta-data[@android:name='LOCALNOTIFY_SHOW_BADGE']">
		<meta-data android:name="LOCALNOTIFY_SHOW_BADGE" android:value="{$localNotify.showBadge}"/>
	</xsl:template>

	<xsl:template match="@*|node()">
		<xsl:copy>
			<xsl:apply-templates select="@*|node()" />
		</xsl:copy>
	</xsl:template>

</xsl:stylesheet>
